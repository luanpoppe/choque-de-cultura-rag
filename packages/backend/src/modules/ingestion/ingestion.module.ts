import { Module } from '@nestjs/common';
import { CoreModule } from '@core/core.module';
import { InfrastructureModule } from '@infrastructure/infrastructure.module';
import { IngestSecretGuard } from '@infrastructure/guards/ingest-secret.guard';
import { IngestionController } from './ingestion.controller';
import { IngestionPipelineService } from './ingestion-pipeline.service';
import { IngestionService } from './ingestion.service';
import { YtDlpService } from './yt-dlp.service';

@Module({
  imports: [CoreModule, InfrastructureModule],
  controllers: [IngestionController],
  providers: [
    IngestionPipelineService,
    IngestionService,
    YtDlpService,
    IngestSecretGuard,
  ],
  exports: [IngestionPipelineService, IngestionService],
})
export class IngestionModule {}
