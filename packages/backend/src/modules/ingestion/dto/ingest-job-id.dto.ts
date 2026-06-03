import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

const ingestJobIdSchema = z.object({
  jobId: z.uuid(),
});

export class IngestJobIdDto extends createZodDto(ingestJobIdSchema) {}
