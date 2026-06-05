import { Module } from '@nestjs/common';
import { CoreModule } from '@core/core.module';
import { VectorStoreModule } from '@infrastructure/vector-store/vector-store.module';
import { RagAgentRunner } from './rag-agent.runner';
import { RagService } from './rag.service';

@Module({
  imports: [CoreModule, VectorStoreModule],
  providers: [RagAgentRunner, RagService],
  exports: [RagService],
})
export class RagModule {}
