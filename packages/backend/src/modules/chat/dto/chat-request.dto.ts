import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

const chatHistoryItemSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(8000),
});

export const chatRequestSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, 'Informe uma pergunta sobre Choque de Cultura.')
    .max(4000),
  history: z.array(chatHistoryItemSchema).max(50).optional(),
});

export class ChatRequestDto extends createZodDto(chatRequestSchema) {}
