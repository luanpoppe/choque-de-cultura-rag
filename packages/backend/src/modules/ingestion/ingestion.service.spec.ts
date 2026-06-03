jest.mock('./ingestion-pipeline.service', () => ({
  IngestionPipelineService: jest.fn(),
}));

import { BadRequestException } from '@nestjs/common';
import { PrismaService } from '@infrastructure/prisma/prisma.service';
import { IngestionService } from './ingestion.service';
import { IngestionPipelineService } from './ingestion-pipeline.service';
import { YtDlpService } from './yt-dlp.service';

describe('IngestionService', () => {
  const prisma = {
    ingestionJob: {
      create: jest.fn().mockResolvedValue({ id: 'job-1' }),
      findUnique: jest.fn(),
    },
  };

  const envService = {
    getEnvs: jest.fn().mockReturnValue({
      CHOQUE_YOUTUBE_CHANNEL_URL: 'https://www.youtube.com/@choque',
      INGEST_DEFAULT_LIMIT: 10,
    }),
  };

  const pipeline = { runJob: jest.fn().mockResolvedValue(undefined) };
  const ytDlp = {
    listOldestVideoIds: jest.fn().mockResolvedValue(['vid1', 'vid2']),
  };

  const service = new IngestionService(
    prisma as unknown as PrismaService,
    envService,
    pipeline as unknown as IngestionPipelineService,
    ytDlp as unknown as YtDlpService,
  );

  beforeEach(() => jest.clearAllMocks());

  it('starts job with explicit video ids', async () => {
    const result = await service.startIngestion({
      youtubeVideoIds: ['dQw4w9WgXcQ'],
      force: false,
    });

    expect(result).toEqual({ jobId: 'job-1' });
    expect(pipeline.runJob).toHaveBeenCalledWith(
      'job-1',
      ['dQw4w9WgXcQ'],
      { force: false },
    );
    expect(ytDlp.listOldestVideoIds).not.toHaveBeenCalled();
  });

  it('resolves ids from channel when body omits list', async () => {
    await service.startIngestion({ force: false } as never);

    expect(ytDlp.listOldestVideoIds).toHaveBeenCalledWith(
      'https://www.youtube.com/@choque',
      10,
    );
    expect(pipeline.runJob).toHaveBeenCalledWith(
      'job-1',
      ['vid1', 'vid2'],
      { force: false },
    );
  });

  it('deduplicates video ids', async () => {
    await service.startIngestion({
      youtubeVideoIds: ['dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
      force: false,
    });

    expect(pipeline.runJob).toHaveBeenCalledWith(
      'job-1',
      ['dQw4w9WgXcQ'],
      { force: false },
    );
  });

  it('throws when no ids and no channel url', async () => {
    envService.getEnvs.mockReturnValueOnce({
      INGEST_DEFAULT_LIMIT: 10,
    });

    await expect(service.startIngestion({} as never)).rejects.toThrow(
      BadRequestException,
    );
  });
});
