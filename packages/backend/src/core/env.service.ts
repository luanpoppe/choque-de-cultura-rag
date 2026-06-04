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
      CHAT_MODEL: z
        .string()
        .min(1)
        .optional()
        .default('openrouter/openai/gpt-4o-mini'),
      RAG_TOP_K: z.coerce.number().int().min(1).max(20).optional().default(6),
      RAG_MAX_DISTANCE: z.coerce
        .number()
        .min(0)
        .max(2)
        .optional()
        .default(0.85),
      RAG_MAX_QUOTE_CHARS: z.coerce
        .number()
        .int()
        .min(80)
        .max(2000)
        .optional()
        .default(280),
      RAG_MAX_HISTORY_MESSAGES: z.coerce
        .number()
        .int()
        .min(0)
        .max(100)
        .optional()
        .default(20),
      CHAT_RATE_LIMIT_MAX: z.coerce
        .number()
        .int()
        .min(0)
        .max(1000)
        .optional()
        .default(20),
      CHAT_RATE_LIMIT_WINDOW_MS: z.coerce
        .number()
        .int()
        .min(1000)
        .max(3_600_000)
        .optional()
        .default(60_000),
    });
    const { data, error } = envSchema.safeParse(process.env);
    if (error) throw new Error(`Invalid env vars: ${error.message}`);

    return data;
  }
}
