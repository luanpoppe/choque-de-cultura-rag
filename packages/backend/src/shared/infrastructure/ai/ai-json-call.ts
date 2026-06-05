import type { AICallParams, AIModelNames } from '@luanpoppe/ai';
import type z from 'zod';
import type { AiService } from './ai.service';

const JSON_ONLY_SUFFIX = `

Responda APENAS com um objeto JSON válido, sem markdown e sem texto antes ou depois.`;

export function extractJsonFromModelText(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced?.[1] ?? trimmed).trim();
  return JSON.parse(candidate) as unknown;
}

export async function callJsonOutput<T extends z.ZodType>(
  aiService: AiService,
  params: {
    aiModel: AIModelNames;
    systemPrompt: string;
    messages: AICallParams['messages'];
    outputSchema: T;
    modelConfig?: AICallParams['modelConfig'];
  },
): Promise<z.infer<T> | null> {
  try {
    const { text } = await aiService.call({
      aiModel: params.aiModel,
      systemPrompt: params.systemPrompt + JSON_ONLY_SUFFIX,
      messages: params.messages,
      modelConfig: params.modelConfig,
    });
    const parsed = params.outputSchema.safeParse(extractJsonFromModelText(text));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
