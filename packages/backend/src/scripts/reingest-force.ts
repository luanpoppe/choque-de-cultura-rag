/**
 * Reingere episódios existentes com force=true (sem HTTP).
 * Uso: pnpm --filter @choque-de-cultura-rag/backend reingest:force
 */
import 'reflect-metadata';
import { config } from 'dotenv';
import { resolve } from 'node:path';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { IngestionPipelineService } from '@modules/ingestion/ingestion-pipeline.service';
import { PrismaService } from '@infrastructure/prisma/prisma.service';
import { IngestionJobStatus } from '@/generated/prisma/client';

config({ path: resolve(__dirname, '../../../../.env') });

const logger = new Logger('reingest-force');

const DEFAULT_VIDEO_IDS = [
  '4u1w1UnqI0Y',
  'pZnWLgFOkBg',
  's5-fdzY1JGw',
  'nox2gG6Mb90',
  'EK65zq2bAKU',
];

async function main(): Promise<void> {
  if (!process.env.OPENAI_API_KEY?.trim()) {
    console.error(
      'OPENAI_API_KEY é obrigatória para transcrição com segmentos (Whisper verbose_json).',
    );
    process.exit(1);
  }

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const prisma = app.get(PrismaService);
    const pipeline = app.get(IngestionPipelineService);

    const job = await prisma.ingestionJob.create({
      data: { status: IngestionJobStatus.PENDING },
    });

    logger.log(
      `Job ${job.id}: reingestão force de ${DEFAULT_VIDEO_IDS.length} episódios…`,
    );

    await pipeline.runJob(job.id, DEFAULT_VIDEO_IDS, { force: true });

    const final = await prisma.ingestionJob.findUnique({ where: { id: job.id } });
    logger.log(
      `Concluído: status=${final?.status} success=${final?.successCount} failure=${final?.failureCount}`,
    );

    const episodes = await prisma.episode.findMany({
      where: { youtubeVideoId: { in: DEFAULT_VIDEO_IDS } },
      select: {
        title: true,
        youtubeVideoId: true,
        lastIngestError: true,
        _count: { select: { chunks: true, transcriptSegments: true } },
      },
      orderBy: { publishedAt: 'asc' },
    });

    for (const ep of episodes) {
      const err = ep.lastIngestError ? ` ERRO: ${ep.lastIngestError}` : '';
      console.log(
        `${ep.youtubeVideoId} | ${ep._count.chunks} chunks, ${ep._count.transcriptSegments} segmentos${err}`,
      );
    }

    process.exit(final?.failureCount ? 1 : 0);
  } finally {
    await app.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
