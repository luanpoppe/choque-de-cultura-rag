import { Module } from '@nestjs/common';
import { ChunkRepository } from './chunk.repository';

@Module({
  providers: [ChunkRepository],
  exports: [ChunkRepository],
})
export class VectorStoreModule {}
