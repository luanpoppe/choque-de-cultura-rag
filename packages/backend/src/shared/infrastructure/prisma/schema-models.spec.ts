import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const schemaPath = join(__dirname, '../../../../prisma/schema.prisma');

describe('Prisma schema — Episode & IngestionJob', () => {
  const schema = readFileSync(schemaPath, 'utf8');

  it('defines IngestionJob with status and counters', () => {
    expect(schema).toMatch(/model IngestionJob/);
    expect(schema).toMatch(/enum IngestionJobStatus/);
    expect(schema).toMatch(/successCount.*@map\("success_count"\)/s);
    expect(schema).toMatch(/failureCount.*@map\("failure_count"\)/s);
    expect(schema).toMatch(/@@map\("ingestion_jobs"\)/);
  });

  it('defines Episode with required metadata fields', () => {
    expect(schema).toMatch(/model Episode/);
    expect(schema).toMatch(/youtubeVideoId.*@unique.*@map\("youtube_video_id"\)/s);
    expect(schema).toMatch(/watchUrl.*@map\("watch_url"\)/);
    expect(schema).toMatch(/durationSec.*@map\("duration_sec"\)/);
    expect(schema).toMatch(/publishedAt.*@map\("published_at"\)/);
    expect(schema).toMatch(/@@map\("episodes"\)/);
  });

  it('documents IngestionJob 1:N Episode relation', () => {
    expect(schema).toMatch(/episodes Episode\[\]/);
    expect(schema).toMatch(/ingestionJobId/);
    expect(schema).toMatch(/ingestionJob\s+IngestionJob\?/);
  });

  it('defines Chunk with vector embedding and temporal fields', () => {
    expect(schema).toMatch(/model Chunk/);
    expect(schema).toMatch(/startSec.*@map\("start_sec"\)/);
    expect(schema).toMatch(/endSec.*@map\("end_sec"\)/);
    expect(schema).toMatch(/Unsupported\("vector\(1536\)"\)/);
    expect(schema).toMatch(/@@map\("chunks"\)/);
  });

  it('defines Episode.lastIngestError for per-episode failures', () => {
    expect(schema).toMatch(/lastIngestError.*@map\("last_ingest_error"\)/);
  });
});
