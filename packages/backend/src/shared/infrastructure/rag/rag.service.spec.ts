jest.mock('@luanpoppe/ai', () => ({
  AIMessages: {
    human: (content: string) => ({ role: 'human', content }),
    ai: (content: string) => ({ role: 'ai', content }),
  },
}));

import { Test, TestingModule } from '@nestjs/testing';
import { EnvService } from '@core/env.service';
import { ChunkRepository } from '@infrastructure/vector-store/chunk.repository';
import type { SimilarChunkWithEpisode } from '@infrastructure/vector-store/chunk.repository';
import { NO_MATCH_REPLY } from './rag-prompts';
import { RagAgentRunner } from './rag-agent.runner';
import { RagService } from './rag.service';

const mockEnvs = {
  DATABASE_URL: 'postgresql://choque:choque@localhost:6017/choque_rag',
  PORT: 3000,
  OPENROUTER_API_KEY: 'test-key',
  EMBEDDING_MODEL: 'openai/text-embedding-3-small',
  WHISPER_MODEL: 'openai/whisper-1',
  INGEST_SECRET: 'secret',
  CHAT_MODEL: 'openrouter/deepseek/deepseek-v4-flash',
  RAG_TOP_K: 6,
  RAG_MAX_DISTANCE: 0.85,
  RAG_MAX_HISTORY_MESSAGES: 20,
  RAG_AGENT_MAX_SEARCHES: 4,
  RAG_NEIGHBOR_CHUNKS: 2,
  SWAGGER_EXPOSE_INTERNAL: false,
};

const sampleChunk = (
  overrides: Partial<SimilarChunkWithEpisode> = {},
): SimilarChunkWithEpisode => ({
  id: 'chunk-1',
  episodeId: 'ep-1',
  text: 'Harry Potter sem Harry Potter foi o tema do episódio.',
  startSec: 60,
  endSec: 120,
  distance: 0.3,
  episodeTitle: 'CHOQUE DE CULTURA #1',
  youtubeVideoId: '4u1w1UnqI0Y',
  durationSec: 381,
  ...overrides,
});

describe('RagService', () => {
  let service: RagService;
  let ragAgentRunner: { run: jest.Mock };
  let chunkRepository: { findTemporalNeighbors: jest.Mock };

  beforeEach(async () => {
    jest.clearAllMocks();
    ragAgentRunner = {
      run: jest.fn().mockResolvedValue({
        reply: 'Resposta do agente.',
        citedChunks: [sampleChunk()],
        searchCount: 1,
      }),
    };
    chunkRepository = {
      findTemporalNeighbors: jest.fn().mockResolvedValue({ before: [], after: [] }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RagService,
        { provide: RagAgentRunner, useValue: ragAgentRunner },
        { provide: ChunkRepository, useValue: chunkRepository },
        { provide: EnvService, useValue: { getEnvs: () => mockEnvs } },
      ],
    }).compile();

    service = module.get(RagService);
  });

  it('deve recusar off-topic sem citações', async () => {
    ragAgentRunner.run.mockResolvedValueOnce({
      reply: 'Só consigo falar sobre Choque de Cultura!',
      citedChunks: [],
      offTopic: true,
      searchCount: 0,
    });

    const result = await service.ask('Qual a previsão do tempo amanhã?');

    expect(result.offTopic).toBe(true);
    expect(result.citations).toEqual([]);
    expect(result.reply).toContain('Choque de Cultura');
    expect(ragAgentRunner.run).toHaveBeenCalledWith(
      expect.objectContaining({
        userMessage: 'Qual a previsão do tempo amanhã?',
        maxSearches: 4,
      }),
    );
  });

  it('deve retornar noMatch quando agente não submete resposta', async () => {
    ragAgentRunner.run.mockResolvedValueOnce({
      reply: NO_MATCH_REPLY,
      citedChunks: [],
      noMatch: true,
      searchCount: 2,
    });

    const result = await service.ask('O que acharam do filme X?');

    expect(result.noMatch).toBe(true);
    expect(result.offTopic).toBeUndefined();
    expect(result.citations).toEqual([]);
  });

  it('mostra só citações escolhidas pelo agente', async () => {
    ragAgentRunner.run.mockResolvedValueOnce({
      reply: 'Sim, confirmaram que Rambo tem livro.',
      citedChunks: [
        sampleChunk({
          id: 'c1',
          startSec: 315,
          text: 'Rambo tem livro? Tem livro.',
        }),
      ],
      searchCount: 2,
    });

    const result = await service.ask('O que falaram sobre Rambo ter livro?');

    expect(result.citations).toHaveLength(1);
    expect(result.citations[0].startSec).toBe(315);
    expect(result.citations[0].quote).toContain('Rambo');
  });

  it('deve retornar reply e citações derivadas dos chunks', async () => {
    const result = await service.ask('O que falaram de Harry Potter?');

    expect(result.citations).toHaveLength(1);
    expect(result.citations[0]).toMatchObject({
      episodeTitle: 'CHOQUE DE CULTURA #1',
      youtubeVideoId: '4u1w1UnqI0Y',
      startSec: 60,
      durationSec: 381,
      watchUrl: 'https://www.youtube.com/watch?v=4u1w1UnqI0Y&t=60s',
    });
    expect(result.citations[0].quote).toContain('Harry Potter');
    expect(result.reply).toBe('Resposta do agente.');
    expect(ragAgentRunner.run).toHaveBeenCalledTimes(1);
  });

  it('deve limitar history às últimas N mensagens', async () => {
    const longHistory = Array.from({ length: 25 }, (_, i) => ({
      role: 'user' as const,
      content: `msg-${i}`,
    }));

    await service.ask('pergunta', longHistory);

    const callArgs = ragAgentRunner.run.mock.calls[0]![0] as {
      historyMessages: { content: string }[];
    };
    const historyContents = callArgs.historyMessages
      .map((m) => m.content)
      .filter((c) => c.startsWith('msg-'));
    expect(historyContents).toHaveLength(20);
    expect(historyContents[0]).toBe('msg-5');
  });

  it('expande quote da citação com chunks vizinhos', async () => {
    chunkRepository.findTemporalNeighbors.mockResolvedValueOnce({
      before: [{ id: 'b1', text: 'Antes.', startSec: 55, endSec: 59 }],
      after: [],
    });

    const result = await service.ask('O que falaram de Harry Potter?');

    expect(result.citations[0].quote).toBe(
      'Antes. Harry Potter sem Harry Potter foi o tema do episódio.',
    );
  });

  it('deve incluir history nas mensagens do agente', async () => {
    await service.ask('E sobre o segundo filme?', [
      { role: 'user', content: 'Falaram de Harry Potter?' },
      { role: 'assistant', content: 'Sim, no episódio 1.' },
    ]);

    expect(ragAgentRunner.run).toHaveBeenCalledWith(
      expect.objectContaining({
        userMessage: 'E sobre o segundo filme?',
        historyMessages: expect.arrayContaining([
          expect.objectContaining({ content: 'Falaram de Harry Potter?' }),
          expect.objectContaining({ content: 'Sim, no episódio 1.' }),
        ]),
      }),
    );
  });
});
