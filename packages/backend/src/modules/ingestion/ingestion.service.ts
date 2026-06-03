import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { IngestionJobStatus } from '@/generated/prisma/client';
import { EnvService } from '@core/env.service';
import { PrismaService } from '@infrastructure/prisma/prisma.service';
import { StartIngestDto } from './dto/start-ingest.dto';
import { IngestionPipelineService } from './ingestion-pipeline.service';
import { YtDlpService } from './yt-dlp.service';

export type IngestJobStatusResponse = {
  jobId: string;
  status: IngestionJobStatus;
  successCount: number;
  failureCount: number;
  createdAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  episodes: {
    youtubeVideoId: string;
    title: string;
    lastIngestError: string | null;
  }[];
};

@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly envService: EnvService,
    private readonly pipeline: IngestionPipelineService,
    private readonly ytDlp: YtDlpService,
  ) {}

  async startIngestion(dto: StartIngestDto): Promise<{ jobId: string }> {
    const youtubeVideoIds = await this.resolveVideoIds(dto);
    if (youtubeVideoIds.length === 0) {
      throw new BadRequestException('No videos to ingest');
    }

    const job = await this.prisma.ingestionJob.create({
      data: { status: IngestionJobStatus.PENDING },
    });

    void this.pipeline
      .runJob(job.id, youtubeVideoIds, { force: dto.force })
      .catch(async (error: unknown) => {
        const message =
          error instanceof Error ? error.message : String(error);
        this.logger.error(`Ingestion job ${job.id} crashed: ${message}`);
        await this.prisma.ingestionJob.update({
          where: { id: job.id },
          data: {
            status: IngestionJobStatus.FAILED,
            completedAt: new Date(),
          },
        });
      });

    return { jobId: job.id };
  }

  async getJobStatus(jobId: string): Promise<IngestJobStatusResponse> {
    const job = await this.prisma.ingestionJob.findUnique({
      where: { id: jobId },
      include: {
        episodes: {
          select: {
            youtubeVideoId: true,
            title: true,
            lastIngestError: true,
          },
          orderBy: { youtubeVideoId: 'asc' },
        },
      },
    });

    if (!job) {
      throw new NotFoundException(`Ingestion job ${jobId} not found`);
    }

    return {
      jobId: job.id,
      status: job.status,
      successCount: job.successCount,
      failureCount: job.failureCount,
      createdAt: job.createdAt,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      episodes: job.episodes,
    };
  }

  private async resolveVideoIds(dto: StartIngestDto): Promise<string[]> {
    let ids: string[];
    if (dto.youtubeVideoIds && dto.youtubeVideoIds.length > 0) {
      ids = dto.youtubeVideoIds;
    } else {
      const envs = this.envService.getEnvs();
      const channelUrl = envs.CHOQUE_YOUTUBE_CHANNEL_URL;
      if (!channelUrl) {
        throw new BadRequestException(
          'Informe youtubeVideoIds no body ou configure CHOQUE_YOUTUBE_CHANNEL_URL',
        );
      }
      const limit = dto.limit ?? envs.INGEST_DEFAULT_LIMIT;
      ids = await this.ytDlp.listOldestVideoIds(channelUrl, limit);
    }

    return [...new Set(ids)];
  }
}
