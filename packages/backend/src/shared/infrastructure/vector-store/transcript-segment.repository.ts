import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infrastructure/prisma/prisma.service';

export type TranscriptSegmentInsert = {
  ord: number;
  startSec: number;
  endSec: number;
  text: string;
  source?: string;
};

@Injectable()
export class TranscriptSegmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async deleteByEpisodeId(episodeId: string): Promise<void> {
    await this.prisma.transcriptSegment.deleteMany({ where: { episodeId } });
  }

  async countByEpisodeId(episodeId: string): Promise<number> {
    return this.prisma.transcriptSegment.count({ where: { episodeId } });
  }

  async insertMany(
    episodeId: string,
    segments: TranscriptSegmentInsert[],
  ): Promise<void> {
    if (segments.length === 0) return;

    await this.prisma.transcriptSegment.createMany({
      data: segments.map((segment) => ({
        episodeId,
        ord: segment.ord,
        startSec: segment.startSec,
        endSec: segment.endSec,
        text: segment.text,
        source: segment.source ?? 'whisper',
      })),
    });
  }
}
