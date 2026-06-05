jest.mock('@luanpoppe/ai', () => ({
  AITools: jest.fn().mockImplementation(() => ({
    createTool: ({
      toolFunction,
    }: {
      toolFunction: (input: Record<string, unknown>) => Promise<string>;
    }) => ({
      invoke: toolFunction,
    }),
  })),
}));

import { createRagAgentTools } from './rag-agent-tools';
import { RagSearchSession } from './rag-search-session';
import type { SimilarChunkWithEpisode } from '@infrastructure/vector-store/chunk.repository';

const chunk = (
  overrides: Partial<SimilarChunkWithEpisode> = {},
): SimilarChunkWithEpisode => ({
  id: '11111111-1111-4111-8111-111111111111',
  episodeId: 'ep-1',
  text: 'achou errado otário',
  startSec: 0,
  endSec: 30,
  distance: 0.4,
  episodeTitle: 'CHOQUE DE CULTURA #3',
  youtubeVideoId: 's5-fdzY1JGw',
  durationSec: 400,
  ...overrides,
});

describe('createRagAgentTools', () => {
  const session = new RagSearchSession();
  const aiService = { embedQuery: jest.fn().mockResolvedValue([0.1]) };
  const chunkRepository = {
    searchSimilarWithEpisode: jest.fn(),
    findTemporalNeighbors: jest.fn().mockResolvedValue({ before: [], after: [] }),
  };

  beforeEach(() => {
    session.searchCount = 0;
    session.submission = null;
    session.chunksById.clear();
    jest.clearAllMocks();
    chunkRepository.findTemporalNeighbors.mockResolvedValue({ before: [], after: [] });
  });

  function getTools(maxSearches = 2) {
    return createRagAgentTools({
      session,
      aiService: aiService as never,
      chunkRepository: chunkRepository as never,
      topK: 6,
      maxDistance: 0.85,
      maxSearches,
      neighborChunks: 2,
    });
  }

  it('search_archive registra chunks e incrementa contador', async () => {
    chunkRepository.searchSimilarWithEpisode.mockResolvedValue([chunk()]);
    const [searchTool] = getTools();
    const raw = await searchTool.invoke({ query: 'achou errado otário' });
    const parsed = JSON.parse(raw as string);

    expect(parsed.resultCount).toBe(1);
    expect(parsed.results[0].chunkId).toBe(chunk().id);
    expect(session.searchCount).toBe(1);
    expect(session.chunksById.has(chunk().id)).toBe(true);
    expect(aiService.embedQuery).toHaveBeenCalledWith('achou errado otário');
  });

  it('search_archive bloqueia após maxSearches', async () => {
    chunkRepository.searchSimilarWithEpisode.mockResolvedValue([chunk()]);
    const [searchTool] = getTools(1);
    await searchTool.invoke({ query: 'primeira' });
    const raw = await searchTool.invoke({ query: 'segunda' });
    const parsed = JSON.parse(raw as string);

    expect(parsed.error).toBe('max_searches_reached');
    expect(session.searchCount).toBe(1);
  });

  it('search_archive inclui contextText com vizinhos', async () => {
    chunkRepository.searchSimilarWithEpisode.mockResolvedValue([
      chunk({ id: '22222222-2222-4222-8222-222222222222', startSec: 89, text: 'Meio.' }),
    ]);
    chunkRepository.findTemporalNeighbors.mockResolvedValue({
      before: [{ id: 'a', text: 'Antes.', startSec: 85, endSec: 88 }],
      after: [{ id: 'b', text: 'Depois.', startSec: 93, endSec: 96 }],
    });
    const [searchTool] = getTools();
    const raw = await searchTool.invoke({ query: 'meio' });
    const parsed = JSON.parse(raw as string);

    expect(parsed.results[0].contextText).toBe('Antes. Meio. Depois.');
    expect(parsed.results[0].text).toBe('Meio.');
  });

  it('submit_answer filtra chunkIds inválidos', async () => {
    session.registerChunks([chunk()]);
    const [, submitTool] = getTools();
    await submitTool.invoke({
      offTopic: false,
      reply: 'Foi no episódio 3.',
      citationChunkIds: [
        chunk().id,
        '22222222-2222-4222-8222-222222222222',
      ],
    });

    expect(session.submission?.citationChunkIds).toEqual([chunk().id]);
  });
});
