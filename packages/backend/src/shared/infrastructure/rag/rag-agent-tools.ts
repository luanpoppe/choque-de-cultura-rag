import { AITools } from '@luanpoppe/ai';
import z from 'zod';
import type { AiService } from '@infrastructure/ai/ai.service';
import type { ChunkRepository } from '@infrastructure/vector-store/chunk.repository';
import type { SimilarChunkWithEpisode } from '@infrastructure/vector-store/chunk.repository';
import { coerceChunkDistance } from './rag-distance';
import { RagSearchSession } from './rag-search-session';
import { MAX_CITATION_CARDS } from './rag-unified-response';

const TEXT_PREVIEW_CHARS = 400;

export type RagAgentToolConfig = {
  session: RagSearchSession;
  aiService: AiService;
  chunkRepository: ChunkRepository;
  topK: number;
  maxDistance: number;
  maxSearches: number;
};

function formatSearchResult(chunk: SimilarChunkWithEpisode) {
  const text =
    chunk.text.length <= TEXT_PREVIEW_CHARS
      ? chunk.text
      : `${chunk.text.slice(0, TEXT_PREVIEW_CHARS - 1).trimEnd()}…`;

  return {
    chunkId: chunk.id,
    episodeTitle: chunk.episodeTitle,
    youtubeVideoId: chunk.youtubeVideoId,
    startSec: chunk.startSec,
    endSec: chunk.endSec,
    distance: Number(coerceChunkDistance(chunk.distance).toFixed(4)),
    text,
  };
}

const searchArchiveInputSchema = z.object({
  query: z
    .string()
    .min(1)
    .describe('Texto de busca em português (pergunta, frase, tema ou sinônimo)'),
  reason: z
    .string()
    .optional()
    .describe('Breve motivo desta busca (opcional, para raciocínio)'),
});

const submitAnswerInputSchema = z.object({
  offTopic: z.boolean(),
  reply: z.string().min(1).describe('Resposta ao usuário em PT-BR'),
  citationChunkIds: z
    .array(z.string().uuid())
    .max(MAX_CITATION_CARDS)
    .describe(
      'chunkIds de search_archive que sustentam a reply (vazio se offTopic ou sem evidência)',
    ),
});

export function createRagAgentTools(config: RagAgentToolConfig) {
  const aiTools = new AITools();

  const searchArchive = aiTools.createTool({
    name: 'search_archive',
    description:
      'Busca semântica no acervo indexado do Choque de Cultura. Reformule a query se os resultados não forem úteis. Retorna chunkId, metadados e trecho.',
    schema: searchArchiveInputSchema,
    toolFunction: async (input: unknown) => {
      const { query } = searchArchiveInputSchema.parse(input);
      if (config.session.searchCount >= config.maxSearches) {
        return JSON.stringify({
          error: 'max_searches_reached',
          message: `Limite de ${config.maxSearches} buscas atingido. Use submit_answer com o que já encontrou.`,
          searchesUsed: config.session.searchCount,
        });
      }

      config.session.searchCount += 1;
      const embedding = await config.aiService.embedQuery(query.trim());
      const candidates = await config.chunkRepository.searchSimilarWithEpisode(
        embedding,
        config.topK,
      );
      const relevant = candidates.filter(
        (c) => coerceChunkDistance(c.distance) <= config.maxDistance,
      );

      config.session.registerChunks(relevant);

      return JSON.stringify({
        searchNumber: config.session.searchCount,
        query,
        resultCount: relevant.length,
        bestDistance:
          relevant[0] != null
            ? Number(coerceChunkDistance(relevant[0].distance).toFixed(4))
            : null,
        results: relevant.map(formatSearchResult),
        hint:
          relevant.length === 0
            ? 'Nenhum trecho relevante. Tente query diferente ou submit_answer informando que não encontrou.'
            : 'Se insuficiente, chame search_archive com outra query antes de submit_answer.',
      });
    },
  });

  const submitAnswer = aiTools.createTool({
    name: 'submit_answer',
    description:
      'Encerra o turno e entrega a resposta ao usuário. Obrigatório em todo turno. offTopic=true não usa citationChunkIds.',
    schema: submitAnswerInputSchema,
    toolFunction: async (input: unknown) => {
      const { offTopic, reply, citationChunkIds } =
        submitAnswerInputSchema.parse(input);
      config.session.setSubmission({
        offTopic,
        reply,
        citationChunkIds: offTopic ? [] : citationChunkIds,
      });
      return JSON.stringify({ status: 'ok' });
    },
  });

  return [searchArchive, submitAnswer];
}
