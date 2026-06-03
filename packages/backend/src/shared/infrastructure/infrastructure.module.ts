import { Module } from '@nestjs/common';
import { AiModule } from './ai/ai.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule, AiModule],
  exports: [PrismaModule, AiModule],
})
export class InfrastructureModule {}
