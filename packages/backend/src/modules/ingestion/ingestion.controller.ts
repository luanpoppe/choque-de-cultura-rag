import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
import { IngestSecretGuard } from '@infrastructure/guards/ingest-secret.guard';
import { StartIngestDto } from './dto/start-ingest.dto';
import { IngestJobIdDto } from './dto/ingest-job-id.dto';
import { IngestionService } from './ingestion.service';

@ApiTags('internal-ingest')
@ApiHeader({ name: 'X-Ingest-Secret', required: true })
@UseGuards(IngestSecretGuard)
@Controller('api/internal')
export class IngestionController {
  constructor(private readonly ingestionService: IngestionService) {}

  @Post('ingest')
  @HttpCode(HttpStatus.ACCEPTED)
  startIngest(@Body() body: StartIngestDto) {
    return this.ingestionService.startIngestion(body);
  }

  @Get('ingest/:jobId')
  getStatus(@Param() params: IngestJobIdDto) {
    return this.ingestionService.getJobStatus(params.jobId);
  }
}
