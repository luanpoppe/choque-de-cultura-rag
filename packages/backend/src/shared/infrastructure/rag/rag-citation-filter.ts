import { AIMessages, type AIModelNames } from '@luanpoppe/ai';
import z from 'zod';
import { callJsonOutput } from '@infrastructure/ai/ai-json-call';
import type { AiService } from '@infrastructure/ai/ai.service';
import type { SimilarChunkWithEpisode } from '@infrastructure/vector-store/chunk.repository';

export const CITATION_FILTER_SYSTEM = `Você seleciona quais trechos numerados do podcast Choque de Cultura devem aparecer como Citation Cards na interface.

Regras:
- Inclua APENAS trechos que são evidência direta para fatos mencionados na resposta do assistente.
- Exclua trechos que falam de outro assunto (ex.: pergunta sobre Rambo → não incluir trecho sobre IMAX).
- Se a resposta descreve VÁRIOS momentos ou episódios distintos, inclua um índice para CADA trecho que sustenta cada momento (não omita o segundo só para economizar cards).
- Use os índices [1], [2], etc. exatamente como fornecidos.
- Se nenhum trecho sustentar a resposta, retorne lista vazia.`;

const citationFilterSchema = z.object({
  citationIndexes: z.array(z.number().int().positive()),
});

function normalizeForMatch(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/\s+/g, ' ');
}

function episodeShortTitle(title: string): string {
  return title
    .replace(/^CHOQUE\s+DE\s+CULTURA\s*/i, '')
    .replace(/^#\s*\d+\s*[:.\-]?\s*/i, '')
    .trim();
}

/** Alinha cards a episódios/momentos que a resposta cita explicitamente. */
export function findCitationIndexesMentionedInReply(
  reply: string,
  chunks: SimilarChunkWithEpisode[],
): number[] {
  const replyNorm = normalizeForMatch(reply);
  const indexes: number[] = [];

  chunks.forEach((chunk, index) => {
    const shortTitle = episodeShortTitle(chunk.episodeTitle);
    if (shortTitle.length >= 4 && replyNorm.includes(normalizeForMatch(shortTitle))) {
      indexes.push(index + 1);
      return;
    }

    const episodeNumber = chunk.episodeTitle.match(/#\s*(\d+)/i)?.[1];
    if (!episodeNumber) return;

    const markers = [
      `episodio #${episodeNumber}`,
      `episodio ${episodeNumber}`,
      `#${episodeNumber}`,
    ];
    if (markers.some((marker) => replyNorm.includes(marker))) {
      indexes.push(index + 1);
    }
  });

  return indexes;
}

export function mergeCitationIndexes(
  primary: number[],
  supplemental: number[],
  maxCount = 6,
): number[] {
  const merged = [...new Set([...primary, ...supplemental])]
    .filter((index) => index >= 1)
    .sort((a, b) => a - b);
  return merged.slice(0, maxCount);
}

function formatChunksForFilter(chunks: SimilarChunkWithEpisode[]): string {
  return chunks
    .map(
      (chunk, index) =>
        `[${index + 1}] ${chunk.startSec}s — ${chunk.episodeTitle}\n${chunk.text.slice(0, 400)}`,
    )
    .join('\n\n');
}

export async function selectCitationIndexes(
  aiService: AiService,
  chatModel: AIModelNames,
  question: string,
  reply: string,
  chunks: SimilarChunkWithEpisode[],
): Promise<number[]> {
  if (chunks.length === 0) return [];
  if (chunks.length === 1) return [1];

  const result = await callJsonOutput(aiService, {
    aiModel: chatModel,
    systemPrompt: `${CITATION_FILTER_SYSTEM}\n\nFormato JSON: {"citationIndexes": number[]}`,
    messages: [
      AIMessages.human(
        `Pergunta do usuário:\n${question}\n\nResposta do assistente:\n${reply}\n\nTrechos recuperados:\n${formatChunksForFilter(chunks)}\n\nQuais índices devem virar Citation Cards?`,
      ),
    ],
    outputSchema: citationFilterSchema,
    modelConfig: { temperature: 0 },
  });

  if (!result) return [1];

  const fromAi = result.citationIndexes.filter(
    (index) => index >= 1 && index <= chunks.length,
  );
  const fromReply = findCitationIndexesMentionedInReply(reply, chunks);
  const merged = mergeCitationIndexes(
    fromAi.length > 0 ? fromAi : [1],
    fromReply,
    chunks.length,
  );

  return merged.length > 0 ? merged : [1];
}

export function pickChunksByIndexes(
  chunks: SimilarChunkWithEpisode[],
  indexes: number[],
): SimilarChunkWithEpisode[] {
  return indexes
    .map((index) => chunks[index - 1])
    .filter((chunk): chunk is SimilarChunkWithEpisode => chunk != null);
}
