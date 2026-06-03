import { Module } from '@nestjs/common';
import { AiModule } from './ai/ai.module';
import { PrismaModule } from './prisma/prisma.module';
import { VectorStoreModule } from './vector-store/vector-store.module';

@Module({
  imports: [PrismaModule, AiModule, VectorStoreModule],
  exports: [PrismaModule, AiModule, VectorStoreModule],
})
export class InfrastructureModule {}
