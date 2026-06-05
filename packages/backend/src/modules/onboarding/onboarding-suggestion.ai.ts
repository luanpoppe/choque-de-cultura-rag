import { AIMessages, type AIModelNames } from '@luanpoppe/ai';
import z from 'zod';
import { callJsonOutput } from '@infrastructure/ai/ai-json-call';
import type { AiService } from '@infrastructure/ai/ai.service';
import { ONBOARDING_SUGGESTIONS_SYSTEM } from './onboarding-suggestion.prompts';

const MAX_SUGGESTION_CHARS = 60;
const MAX_SAMPLES_FOR_PROMPT = 8;
const MAX_EXCERPT_CHARS = 280;

const suggestionsSchema = z.object({
  suggestions: z.array(z.string().min(8)).min(0).max(6),
});

export type CorpusSample = {
  text: string;
  title: string;
};

function truncateExcerpt(text: string, maxChars: number): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxChars) return normalized;
  const cut = normalized.slice(0, maxChars);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > 40 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

function formatSamplesForPrompt(samples: CorpusSample[]): string {
  return samples
    .slice(0, MAX_SAMPLES_FOR_PROMPT)
    .map(
      (sample, index) =>
        `[${index + 1}] Episódio: ${sample.title}\nTrecho: ${truncateExcerpt(sample.text, MAX_EXCERPT_CHARS)}`,
    )
    .join('\n\n');
}

export function normalizeAiSuggestions(
  raw: string[],
  limit: number,
): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const item of raw) {
    if (result.length >= limit) break;
    let suggestion = item.replace(/\s+/g, ' ').trim();
    if (!suggestion.endsWith('?')) {
      suggestion = suggestion.replace(/[.!]+$/, '').trim();
      suggestion = `${suggestion}?`;
    }
    if (suggestion.length > MAX_SUGGESTION_CHARS) {
      suggestion = `${suggestion.slice(0, MAX_SUGGESTION_CHARS - 1).trimEnd()}…`;
    }
    const key = suggestion.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(suggestion);
  }

  return result;
}

export async function generateOnboardingSuggestionsWithAi(
  aiService: AiService,
  chatModel: AIModelNames,
  samples: CorpusSample[],
  limit: number,
): Promise<string[] | null> {
  if (samples.length === 0) return null;

  try {
    const response = await callJsonOutput(aiService, {
      aiModel: chatModel,
      systemPrompt: `${ONBOARDING_SUGGESTIONS_SYSTEM}\n\nFormato JSON (sem markdown): {"suggestions": string[]}`,
      messages: [
        AIMessages.human(
          [
            'Entrada:',
            '',
            formatSamplesForPrompt(samples),
            '',
            `Gere as perguntas conforme as instruções. Use no máximo ${limit} itens se o acervo permitir (entre 3 e 6 quando houver contexto suficiente).`,
          ].join('\n'),
        ),
      ],
      outputSchema: suggestionsSchema,
      modelConfig: { temperature: 0.65 },
    });

    if (!response) return null;

    const normalized = normalizeAiSuggestions(response.suggestions, limit);
    if (normalized.length === 0) return [];
    return normalized;
  } catch {
    return null;
  }
}
