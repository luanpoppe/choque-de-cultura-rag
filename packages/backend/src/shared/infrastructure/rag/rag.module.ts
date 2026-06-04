import { Module } from '@nestjs/common';
import { CoreModule } from '@core/core.module';
import { VectorStoreModule } from '@infrastructure/vector-store/vector-store.module';
import { RagService } from './rag.service';

@Module({
  imports: [CoreModule, VectorStoreModule],
  providers: [RagService],
  exports: [RagService],
})
export class RagModule {}
