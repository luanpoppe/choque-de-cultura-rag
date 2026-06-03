import { readFile } from 'node:fs/promises';
import { Injectable, Logger } from '@nestjs/common';
import { IngestionJobStatus } from '@/generated/prisma/client';
import { AiService } from '@infrastructure/ai/ai.service';
import { PrismaService } from '@infrastructure/prisma/prisma.service';
import { ChunkRepository } from '@infrastructure/vector-store/chunk.repository';
import { segmentTranscriptIntoChunks } from './segment-transcript';
import { YtDlpService } from './yt-dlp.service';

export type RunIngestionJobOptions = {
  force?: boolean;
};

@Injectable()
export class IngestionPipelineService {
  private readonly logger = new Logger(IngestionPipelineService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
    private readonly ytDlp: YtDlpService,
    private readonly chunkRepository: ChunkRepository,
  ) {}

  /**
   * Processa um lote de vídeos para o job informado (worker in-process; HTTP na story 1.5).
   */
  async runJob(
    jobId: string,
    youtubeVideoIds: string[],
    options: RunIngestionJobOptions = {},
  ): Promise<void> {
    const force = options.force ?? false;

    await this.prisma.ingestionJob.update({
      where: { id: jobId },
      data: {
        status: IngestionJobStatus.RUNNING,
        startedAt: new Date(),
        successCount: 0,
        failureCount: 0,
      },
    });

    let successCount = 0;
    let failureCount = 0;

    if (youtubeVideoIds.length === 0) {
      await this.prisma.ingestionJob.update({
        where: { id: jobId },
        data: {
          status: IngestionJobStatus.COMPLETED,
          successCount: 0,
          failureCount: 0,
          completedAt: new Date(),
        },
      });
      return;
    }

    for (const videoId of youtubeVideoIds) {
      try {
        const processed = await this.processEpisode(jobId, videoId, force);
        if (processed) successCount += 1;
      } catch (error) {
        failureCount += 1;
        const message =
          error instanceof Error ? error.message : String(error);
        this.logger.warn(`Ingest failed for ${videoId}: ${message}`);
        await this.recordEpisodeFailure(videoId, jobId, message);
      }
    }

    await this.prisma.ingestionJob.update({
      where: { id: jobId },
      data: {
        status:
          failureCount > 0 && successCount === 0
            ? IngestionJobStatus.FAILED
            : IngestionJobStatus.COMPLETED,
        successCount,
        failureCount,
        completedAt: new Date(),
      },
    });
  }

  private async processEpisode(
    jobId: string,
    videoId: string,
    force: boolean,
  ): Promise<boolean> {
    const metadata = await this.ytDlp.fetchMetadata(videoId);

    const episode = await this.prisma.episode.upsert({
      where: { youtubeVideoId: metadata.youtubeVideoId },
      create: {
        youtubeVideoId: metadata.youtubeVideoId,
        title: metadata.title,
        watchUrl: metadata.watchUrl,
        durationSec: metadata.durationSec,
        publishedAt: metadata.publishedAt,
        ingestionJobId: jobId,
        lastIngestError: null,
      },
      update: {
        title: metadata.title,
        watchUrl: metadata.watchUrl,
        durationSec: metadata.durationSec,
        publishedAt: metadata.publishedAt,
        ingestionJobId: jobId,
        lastIngestError: null,
      },
    });

    const existingChunks = await this.chunkRepository.countByEpisodeId(
      episode.id,
    );
    if (existingChunks > 0 && !force) {
      this.logger.log(`Skipping ${videoId}: already indexed (${existingChunks} chunks)`);
      return false;
    }

    const { audioPath, cleanup } = await this.ytDlp.downloadAudio(videoId);
    try {
      const audioBuffer = await readFile(audioPath);
      const transcript = await this.aiService.transcribeWithWhisper(
        audioBuffer,
        { format: 'mp3', languageIn2Digits: 'pt' },
      );

      const durationSec = metadata.durationSec ?? 1;
      const segments = segmentTranscriptIntoChunks(transcript, durationSec);
      if (segments.length === 0) {
        throw new Error('Transcription produced no segmentable content');
      }

      const embeddings = await this.aiService.embedDocuments(
        segments.map((s) => s.text),
      );
      if (embeddings.length !== segments.length) {
        throw new Error(
          `Embedding count mismatch: expected ${segments.length}, got ${embeddings.length}`,
        );
      }

      await this.chunkRepository.deleteByEpisodeId(episode.id);
      await this.chunkRepository.insertMany(
        segments.map((segment, index) => ({
          episodeId: episode.id,
          text: segment.text,
          startSec: segment.startSec,
          endSec: segment.endSec,
          embedding: embeddings[index],
        })),
      );

      return true;
    } finally {
      await cleanup();
    }
  }

  private async recordEpisodeFailure(
    videoId: string,
    jobId: string,
    message: string,
  ): Promise<void> {
    const updated = await this.prisma.episode.updateMany({
      where: { youtubeVideoId: videoId },
      data: { ingestionJobId: jobId, lastIngestError: message },
    });
    if (updated.count > 0) return;

    await this.prisma.episode.create({
      data: {
        youtubeVideoId: videoId,
        title: videoId,
        watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
        ingestionJobId: jobId,
        lastIngestError: message,
      },
    });
  }
}
