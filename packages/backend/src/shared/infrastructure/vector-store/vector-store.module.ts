import { Module } from '@nestjs/common';
import { ChunkRepository } from './chunk.repository';
import { TranscriptSegmentRepository } from './transcript-segment.repository';

@Module({
  providers: [ChunkRepository, TranscriptSegmentRepository],
  exports: [ChunkRepository, TranscriptSegmentRepository],
})
export class VectorStoreModule {}
