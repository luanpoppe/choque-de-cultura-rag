import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@/generated/prisma/client';
import { PrismaService } from '@infrastructure/prisma/prisma.service';

export type ChunkInsert = {
  episodeId: string;
  text: string;
  startSec: number;
  endSec: number;
  embedding: number[];
};

export type SimilarChunk = {
  id: string;
  episodeId: string;
  text: string;
  startSec: number;
  endSec: number;
  distance: number;
};

export const EMBEDDING_DIMENSION = 1536;

@Injectable()
export class ChunkRepository {
  constructor(private readonly prisma: PrismaService) {}

  async deleteByEpisodeId(episodeId: string): Promise<void> {
    await this.prisma.chunk.deleteMany({ where: { episodeId } });
  }

  async countByEpisodeId(episodeId: string): Promise<number> {
    return this.prisma.chunk.count({ where: { episodeId } });
  }

  async insertMany(chunks: ChunkInsert[]): Promise<void> {
    if (chunks.length === 0) return;

    for (const chunk of chunks) {
      if (chunk.embedding.length !== EMBEDDING_DIMENSION) {
        throw new Error(
          `Embedding dimension must be ${EMBEDDING_DIMENSION}, got ${chunk.embedding.length}`,
        );
      }
      const vectorSql = Prisma.raw(
        `'[${chunk.embedding.join(',')}]'::vector`,
      );
      await this.prisma.$executeRaw(
        Prisma.sql`
          INSERT INTO chunks (id, episode_id, text, start_sec, end_sec, embedding)
          VALUES (
            ${randomUUID()}::uuid,
            ${chunk.episodeId}::uuid,
            ${chunk.text},
            ${chunk.startSec},
            ${chunk.endSec},
            ${vectorSql}
          )
        `,
      );
    }
  }

  async searchSimilar(
    embedding: number[],
    limit = 6,
  ): Promise<SimilarChunk[]> {
    if (embedding.length !== EMBEDDING_DIMENSION) {
      throw new Error(
        `Query embedding dimension must be ${EMBEDDING_DIMENSION}`,
      );
    }
    const vectorSql = Prisma.raw(`'[${embedding.join(',')}]'::vector`);

    return this.prisma.$queryRaw<SimilarChunk[]>(
      Prisma.sql`
        SELECT
          id,
          episode_id AS "episodeId",
          text,
          start_sec AS "startSec",
          end_sec AS "endSec",
          (embedding <=> ${vectorSql}) AS distance
        FROM chunks
        ORDER BY embedding <=> ${vectorSql}
        LIMIT ${limit}
      `,
    );
  }
}
