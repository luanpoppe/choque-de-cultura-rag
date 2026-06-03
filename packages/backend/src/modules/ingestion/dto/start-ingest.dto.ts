import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { normalizeYoutubeVideoId } from '../youtube-video-id';

const startIngestSchema = z
  .object({
    youtubeVideoIds: z
      .array(z.string().min(1))
      .optional()
      .transform((ids) =>
        ids?.map((id) => normalizeYoutubeVideoId(id)),
      ),
    force: z.boolean().optional().default(false),
    limit: z.coerce.number().int().min(1).max(50).optional(),
  })
  .default({});

export class StartIngestDto extends createZodDto(startIngestSchema) {}
