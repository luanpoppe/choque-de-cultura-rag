import { Injectable } from '@nestjs/common';
import z from 'zod';

@Injectable()
export class EnvService {
  getEnvs() {
    const envSchema = z.object({
      DATABASE_URL: z
        .string()
        .min(1)
        .refine(
          (value) =>
            value.startsWith('postgresql://') ||
            value.startsWith('postgres://'),
          { message: 'DATABASE_URL must be a PostgreSQL connection string' },
        ),
      PORT: z.coerce.number().optional().default(3000),
      OPENROUTER_API_KEY: z.string().min(1),
      EMBEDDING_MODEL: z
        .string()
        .min(1)
        .optional()
        .default('openai/text-embedding-3-small'),
      WHISPER_MODEL: z
        .string()
        .min(1)
        .optional()
        .default('openai/whisper-1'),
      GEMINI_API_KEY: z.string().min(1).optional(),
      YTDLP_BIN: z.string().min(1).optional(),
      INGEST_TEMP_DIR: z.string().min(1).optional(),
      INGEST_SECRET: z.string().min(1),
      CHOQUE_YOUTUBE_CHANNEL_URL: z.string().url().optional(),
      INGEST_DEFAULT_LIMIT: z.coerce.number().int().min(1).max(50).optional().default(10),
      SWAGGER_EXPOSE_INTERNAL: z
        .enum(['true', 'false'])
        .optional()
        .default('false')
        .transform((v) => v === 'true'),
    });
    const { data, error } = envSchema.safeParse(process.env);
    if (error) throw new Error(`Invalid env vars: ${error.message}`);

    return data;
  }
}
