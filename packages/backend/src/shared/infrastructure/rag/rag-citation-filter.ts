import { AIMessages, type AIModelNames } from '@luanpoppe/ai';
import z from 'zod';
import { callJsonOutput } from '@infrastructure/ai/ai-json-call';
import type { AiService } from '@infrastructure/ai/ai.service';
import type { SimilarChunkWithEpisode } from '@infrastructure/vector-store/chunk.repository';
import { MAX_CITATION_CARDS } from './rag-unified-response';

export const CITATION_FILTER_SYSTEM = `Você é um filtro rigoroso de Citation Cards do podcast Choque de Cultura. A maioria dos trechos recuperados deve ser REJEITADA: só passam os que provam fatos específicos da resposta.

Para INCLUIR um índice [N], TODOS os critérios abaixo precisam ser verdadeiros:
1. O texto do trecho [N] contém evidência direta e verificável para uma afirmação concreta da resposta do assistente (não basta tema parecido ou mesmo episódio).
2. Essa afirmação responde de fato à pergunta do usuário — não apenas ao universo temático do podcast.
3. Se esse trecho fosse removido, a resposta ficaria sem suporte para aquela afirmação específica.

EXCLUIR sempre:
- Trechos tangenciais, genéricos ou só “próximos” por similaridade semântica (ex.: pergunta sobre Rambo → não incluir trecho sobre IMAX ou outro filme de ação).
- Trechos que não mencionam nomes, eventos ou detalhes que a resposta afirmou.
- Trechos duplicados que sustentam o mesmo fato (fique só com o mais específico).
- Trechos incluídos só porque o episódio aparece na resposta, sem o conteúdo do trecho sustentar o que foi dito.
- Trechos que falam de outro momento, convidado ou assunto do episódio.

Quantidade:
- Prefira 1 card; use 2–3 somente se houver afirmações distintas, cada uma com evidência em trechos diferentes.
- Nunca inclua todos os índices “por garantia”. Na dúvida, EXCLUA.

Índices: use [1], [2], etc. exatamente como fornecidos.
Se nenhum trecho sustenta a resposta com evidência direta, retorne citationIndexes: [].`;

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
        [
          'Selecione o MÍNIMO de índices cujos trechos provam a resposta. Seja conservador — na dúvida, exclua.',
          '',
          `Pergunta do usuário:\n${question}`,
          '',
          `Resposta do assistente:\n${reply}`,
          '',
          `Trechos recuperados (ordenados por similaridade; [1] é o mais próximo da busca, mas pode ser irrelevante):\n${formatChunksForFilter(chunks)}`,
          '',
          'Retorne apenas {"citationIndexes": number[]} com índices válidos ou lista vazia.',
        ].join('\n'),
      ),
    ],
    outputSchema: citationFilterSchema,
    modelConfig: { temperature: 0 },
  });

  if (!result) return [1];

  const fromAi = result.citationIndexes
    .filter((index) => index >= 1 && index <= chunks.length)
    .slice(0, MAX_CITATION_CARDS);

  return fromAi;
}

export function pickChunksByIndexes(
  chunks: SimilarChunkWithEpisode[],
  indexes: number[],
): SimilarChunkWithEpisode[] {
  return indexes
    .map((index) => chunks[index - 1])
    .filter((chunk): chunk is SimilarChunkWithEpisode => chunk != null);
}
