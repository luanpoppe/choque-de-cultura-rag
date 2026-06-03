import { Global, Injectable } from '@nestjs/common';
import z from 'zod';

@Injectable()
@Global()
export class EnvService {
  getEnvs() {
    const envSchema = z.object({
      PORT: z.coerce.number().optional().default(3000),
      GEMINI_API_KEY: z.string().min(1).optional(),
      OPENAI_API_KEY: z.string().min(1).optional(),
    });
    const { data, error } = envSchema.safeParse(process.env);
    if (error) throw new Error(`Invalid env vars: ${error.message}`);

    return data;
  }
}
