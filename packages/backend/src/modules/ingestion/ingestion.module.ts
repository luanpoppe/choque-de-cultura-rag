import { Module } from '@nestjs/common';
import { InfrastructureModule } from '@infrastructure/infrastructure.module';
import { IngestSecretGuard } from '@infrastructure/guards/ingest-secret.guard';
import { IngestionController } from './ingestion.controller';
import { IngestionPipelineService } from './ingestion-pipeline.service';
import { IngestionService } from './ingestion.service';
import { YtDlpService } from './yt-dlp.service';

@Module({
  imports: [InfrastructureModule],
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
