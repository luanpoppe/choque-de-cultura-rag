jest.mock('@infrastructure/ai/ai.service', () => ({
  AiService: jest.fn(),
}));

jest.mock('node:fs/promises', () => ({
  readFile: jest.fn().mockResolvedValue(Buffer.from('fake-audio')),
}));

import { IngestionJobStatus } from '@/generated/prisma/client';
import { AiService } from '@infrastructure/ai/ai.service';
import { PrismaService } from '@infrastructure/prisma/prisma.service';
import { ChunkRepository } from '@infrastructure/vector-store/chunk.repository';
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
    transcribeWithWhisper: jest.fn(),
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

  const service = new IngestionPipelineService(
    prisma as unknown as PrismaService,
    aiService as unknown as AiService,
    ytDlp as unknown as YtDlpService,
    chunkRepository as unknown as ChunkRepository,
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
    aiService.transcribeWithWhisper.mockResolvedValue(
      'palavras suficientes para gerar chunks no episódio de teste do podcast',
    );
    aiService.embedDocuments.mockImplementation((texts: string[]) =>
      Promise.resolve(
        texts.map(() => Array.from({ length: 1536 }, () => 0.1)),
      ),
    );
  });

  it('marks job completed after successful episode processing', async () => {
    await service.runJob(jobId, ['abc123']);

    expect(prisma.ingestionJob.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: jobId },
        data: expect.objectContaining({
          status: IngestionJobStatus.RUNNING,
        }),
      }),
    );
    expect(prisma.ingestionJob.update).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: IngestionJobStatus.COMPLETED,
          successCount: 1,
          failureCount: 0,
        }),
      }),
    );
    expect(chunkRepository.insertMany).toHaveBeenCalled();
    const cleanup = (
      ytDlp.downloadAudio
    ).mock.results[0]?.value as Promise<{ cleanup: () => Promise<void> }>;
    await expect(cleanup).resolves.toEqual(
      expect.objectContaining({ cleanup: expect.any(Function) }),
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
          status: IngestionJobStatus.COMPLETED,
        }),
      }),
    );
  });

  it('skips episode when chunks exist and force is false', async () => {
    chunkRepository.countByEpisodeId.mockResolvedValue(3);

    await service.runJob(jobId, ['abc123']);

    expect(ytDlp.downloadAudio).not.toHaveBeenCalled();
    expect(prisma.ingestionJob.update).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ successCount: 0 }),
      }),
    );
  });
});
