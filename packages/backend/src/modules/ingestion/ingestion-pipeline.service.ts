import { Inject, Injectable, Logger } from '@nestjs/common';
import { EnvService } from '@core/env.service';
import { IngestionJobStatus } from '@/generated/prisma/client';
import { AiService } from '@infrastructure/ai/ai.service';
import { PrismaService } from '@infrastructure/prisma/prisma.service';
import { ChunkRepository } from '@infrastructure/vector-store/chunk.repository';
import { TranscriptSegmentRepository } from '@infrastructure/vector-store/transcript-segment.repository';
import { mergeTranscriptSegmentsIntoChunks } from './merge-transcript-segments';
import { YtDlpService } from './yt-dlp.service';

export type RunIngestionJobOptions = {
  force?: boolean;
};

@Injectable()
export class IngestionPipelineService {
  private readonly logger = new Logger(IngestionPipelineService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(EnvService) private readonly envService: EnvService,
    private readonly aiService: AiService,
    private readonly ytDlp: YtDlpService,
    private readonly chunkRepository: ChunkRepository,
    private readonly transcriptSegmentRepository: TranscriptSegmentRepository,
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
      const durationSec = metadata.durationSec ?? 1;
      const { segments: sttSegments } =
        await this.aiService.transcribeAudioFileWithSegments(
          audioPath,
          durationSec,
          { format: 'mp3', languageIn2Digits: 'pt' },
        );

      if (sttSegments.length === 0) {
        throw new Error('Transcription produced no STT segments');
      }

      await this.transcriptSegmentRepository.deleteByEpisodeId(episode.id);
      await this.transcriptSegmentRepository.insertMany(
        episode.id,
        sttSegments.map((segment, ord) => ({
          ord,
          startSec: segment.startSec,
          endSec: segment.endSec,
          text: segment.text,
          source: 'whisper',
        })),
      );

      const envs = this.envService.getEnvs();
      const chunks = mergeTranscriptSegmentsIntoChunks(sttSegments, {
        fineGrainedHeadSec: envs.INGEST_FINE_GRAINED_HEAD_SEC,
        chunkDurationSec: envs.INGEST_CHUNK_DURATION_SEC,
      });
      if (chunks.length === 0) {
        throw new Error('Transcription produced no chunkable content');
      }

      const embeddings = await this.aiService.embedDocuments(
        chunks.map((s) => s.text),
      );
      if (embeddings.length !== chunks.length) {
        throw new Error(
          `Embedding count mismatch: expected ${chunks.length}, got ${embeddings.length}`,
        );
      }

      await this.chunkRepository.deleteByEpisodeId(episode.id);
      await this.chunkRepository.insertMany(
        chunks.map((segment, index) => ({
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
