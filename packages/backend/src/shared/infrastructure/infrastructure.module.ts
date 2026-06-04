import { Module } from '@nestjs/common';
import { AiModule } from './ai/ai.module';
import { PrismaModule } from './prisma/prisma.module';
import { RagModule } from './rag/rag.module';
import { VectorStoreModule } from './vector-store/vector-store.module';

@Module({
  imports: [PrismaModule, AiModule, VectorStoreModule, RagModule],
  exports: [PrismaModule, AiModule, VectorStoreModule, RagModule],
})
export class InfrastructureModule {}
