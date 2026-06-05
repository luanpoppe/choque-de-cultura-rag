jest.mock('@infrastructure/ai/ai.service', () => ({
  AiService: jest.fn(),
}));

import { IngestionJobStatus } from '@/generated/prisma/client';
import { AiService } from '@infrastructure/ai/ai.service';
import { PrismaService } from '@infrastructure/prisma/prisma.service';
import { ChunkRepository } from '@infrastructure/vector-store/chunk.repository';
import { TranscriptSegmentRepository } from '@infrastructure/vector-store/transcript-segment.repository';
import { IngestionPipelineService } from './ingestion-pipeline.service';
import { YtDlpService } from './yt-dlp.service';

describe('IngestionPipelineService', () => {
  const jobId = '550e8400-e29b-41d4-a716-446655440001';
  const episodeId = '550e8400-e29b-41d4-a716-446655440002';

  const prisma = {
    ingestionJob: { update: jest.fn() },
    episode: {
      upsert: jest.fn(),
      updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      create: jest.fn(),
    },
  };

  const aiService = {
    transcribeAudioFileWithSegments: jest.fn(),
    embedDocuments: jest.fn(),
  };

  const ytDlp = {
    fetchMetadata: jest.fn(),
    downloadAudio: jest.fn(),
  };

  const chunkRepository = {
    countByEpisodeId: jest.fn(),
    deleteByEpisodeId: jest.fn(),
    insertMany: jest.fn(),
  };

  const transcriptSegmentRepository = {
    deleteByEpisodeId: jest.fn(),
    insertMany: jest.fn(),
  };

  const envService = {
    getEnvs: () => ({
      INGEST_FINE_GRAINED_HEAD_SEC: 180,
      INGEST_CHUNK_DURATION_SEC: 30,
      INGEST_OVERLAP_RATIO: 0.25,
      INGEST_HEAD_CONTEXT_SEC: 20,
    }),
  };

  const service = new IngestionPipelineService(
    prisma as unknown as PrismaService,
    envService as never,
    aiService as unknown as AiService,
    ytDlp as unknown as YtDlpService,
    chunkRepository as unknown as ChunkRepository,
    transcriptSegmentRepository as unknown as TranscriptSegmentRepository,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.ingestionJob.update.mockResolvedValue({});
    ytDlp.fetchMetadata.mockResolvedValue({
      youtubeVideoId: 'abc123',
      title: 'Episódio teste',
      watchUrl: 'https://www.youtube.com/watch?v=abc123',
      durationSec: 120,
      publishedAt: null,
    });
    prisma.episode.upsert.mockResolvedValue({
      id: episodeId,
      youtubeVideoId: 'abc123',
    });
    chunkRepository.countByEpisodeId.mockResolvedValue(0);
    ytDlp.downloadAudio.mockResolvedValue({
      audioPath: '/tmp/abc123.mp3',
      cleanup: jest.fn().mockResolvedValue(undefined),
    });
    aiService.transcribeAudioFileWithSegments.mockResolvedValue({
      text: 'trecho um trecho dois',
      segments: [
        { startSec: 10.5, endSec: 40.2, text: 'trecho um' },
        { startSec: 40.2, endSec: 70.0, text: 'trecho dois' },
      ],
    });
    aiService.embedDocuments.mockImplementation((texts: string[]) =>
      Promise.resolve(
        texts.map(() => Array.from({ length: 1536 }, () => 0.1)),
      ),
    );
  });

  it('marks job completed and persists segments with real timestamps', async () => {
    await service.runJob(jobId, ['abc123']);

    expect(aiService.transcribeAudioFileWithSegments).toHaveBeenCalledWith(
      '/tmp/abc123.mp3',
      120,
      expect.objectContaining({ languageIn2Digits: 'pt' }),
    );
    expect(transcriptSegmentRepository.insertMany).toHaveBeenCalledWith(
      episodeId,
      expect.arrayContaining([
        expect.objectContaining({
          ord: 0,
          startSec: 10.5,
          endSec: 40.2,
          source: 'whisper',
        }),
      ]),
    );
    expect(chunkRepository.insertMany).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          episodeId,
          startSec: 10,
          text: 'trecho um trecho dois',
        }),
        expect.objectContaining({
          episodeId,
          startSec: 40,
          text: 'trecho um trecho dois',
        }),
      ]),
    );
    const inserted = chunkRepository.insertMany.mock.calls[0]?.[0] as unknown[];
    expect(inserted).toHaveLength(2);
    expect(prisma.ingestionJob.update).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: IngestionJobStatus.COMPLETED,
          successCount: 1,
        }),
      }),
    );
  });

  it('records episode error without blocking other videos', async () => {
    ytDlp.fetchMetadata
      .mockRejectedValueOnce(new Error('yt-dlp down'))
      .mockResolvedValueOnce({
        youtubeVideoId: 'ok999',
        title: 'OK',
        watchUrl: 'https://www.youtube.com/watch?v=ok999',
        durationSec: 90,
        publishedAt: null,
      });
    prisma.episode.upsert.mockResolvedValue({
      id: 'ep-ok',
      youtubeVideoId: 'ok999',
    });
    chunkRepository.countByEpisodeId.mockResolvedValue(0);

    await service.runJob(jobId, ['fail1', 'ok999']);

    expect(prisma.episode.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { youtubeVideoId: 'fail1' },
        data: expect.objectContaining({ lastIngestError: expect.any(String) }),
      }),
    );
    expect(prisma.ingestionJob.update).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          successCount: 1,
          failureCount: 1,
        }),
      }),
    );
  });

  it('skips episode when chunks exist and force is false', async () => {
    chunkRepository.countByEpisodeId.mockResolvedValue(3);

    await service.runJob(jobId, ['abc123']);

    expect(ytDlp.downloadAudio).not.toHaveBeenCalled();
    expect(aiService.transcribeAudioFileWithSegments).not.toHaveBeenCalled();
  });
});
