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

export type SimilarChunkWithEpisode = SimilarChunk & {
  episodeTitle: string;
  youtubeVideoId: string;
  durationSec: number | null;
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
    const rows = await this.searchSimilarWithEpisode(embedding, limit);
    return rows.map(
      ({
        episodeTitle: _episodeTitle,
        youtubeVideoId: _youtubeVideoId,
        durationSec: _durationSec,
        ...chunk
      }) => chunk,
    );
  }

  async searchSimilarWithEpisode(
    embedding: number[],
    limit = 6,
  ): Promise<SimilarChunkWithEpisode[]> {
    if (embedding.length !== EMBEDDING_DIMENSION) {
      throw new Error(
        `Query embedding dimension must be ${EMBEDDING_DIMENSION}`,
      );
    }
    const vectorSql = Prisma.raw(`'[${embedding.join(',')}]'::vector`);

    return this.prisma.$queryRaw<SimilarChunkWithEpisode[]>(
      Prisma.sql`
        SELECT
          c.id,
          c.episode_id AS "episodeId",
          c.text,
          c.start_sec AS "startSec",
          c.end_sec AS "endSec",
          (c.embedding <=> ${vectorSql}) AS distance,
          e.title AS "episodeTitle",
          e.youtube_video_id AS "youtubeVideoId",
          e.duration_sec AS "durationSec"
        FROM chunks c
        INNER JOIN episodes e ON e.id = c.episode_id
        ORDER BY c.embedding <=> ${vectorSql}
        LIMIT ${limit}
      `,
    );
  }
}
