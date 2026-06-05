jest.mock('@luanpoppe/ai', () => ({
  AIMessages: {
    human: (content: string) => ({ role: 'human', content }),
    ai: (content: string) => ({ role: 'ai', content }),
  },
}));
jest.mock('@infrastructure/ai/ai-json-call', () => ({
  callJsonOutput: jest.fn(),
}));

import { callJsonOutput } from '@infrastructure/ai/ai-json-call';
import { Test, TestingModule } from '@nestjs/testing';
import { EnvService } from '@core/env.service';
import { AiService } from '@infrastructure/ai/ai.service';
import { ChunkRepository } from '@infrastructure/vector-store/chunk.repository';
import type { SimilarChunkWithEpisode } from '@infrastructure/vector-store/chunk.repository';
import { NO_MATCH_REPLY } from './rag-prompts';
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
  RAG_MAX_QUOTE_CHARS: 280,
  RAG_MAX_HISTORY_MESSAGES: 20,
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

const mockCallJson = callJsonOutput as jest.Mock;

describe('RagService', () => {
  let service: RagService;
  let aiService: {
    embedQuery: jest.Mock;
    call: jest.Mock;
  };
  let chunkRepository: { searchSimilarWithEpisode: jest.Mock };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockCallJson.mockImplementation(async (_ai, params) => {
      if (params.systemPrompt.includes('classifica se a pergunta')) {
        return { offTopic: false };
      }
      return { citationIndexes: [1] };
    });
    aiService = {
      embedQuery: jest.fn().mockResolvedValue([0.1]),
      call: jest.fn().mockResolvedValue({ text: 'Resposta do agente.' }),
    };
    chunkRepository = {
      searchSimilarWithEpisode: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RagService,
        { provide: AiService, useValue: aiService },
        { provide: ChunkRepository, useValue: chunkRepository },
        { provide: EnvService, useValue: { getEnvs: () => mockEnvs } },
      ],
    }).compile();

    service = module.get(RagService);
  });

  it('deve recusar off-topic sem citações', async () => {
    mockCallJson.mockResolvedValueOnce({ offTopic: true });
    aiService.call.mockResolvedValueOnce({
      text: 'Só consigo falar sobre Choque de Cultura!',
    });

    const result = await service.ask('Qual a previsão do tempo amanhã?');

    expect(result.offTopic).toBe(true);
    expect(result.citations).toEqual([]);
    expect(result.reply).toContain('Choque de Cultura');
    expect(aiService.embedQuery).not.toHaveBeenCalled();
  });

  it('deve retornar noMatch quando acervo vazio', async () => {
    chunkRepository.searchSimilarWithEpisode.mockResolvedValue([]);

    const result = await service.ask('O que acharam do filme X?');

    expect(result.noMatch).toBe(true);
    expect(result.offTopic).toBeUndefined();
    expect(mockCallJson).toHaveBeenCalledTimes(1);
  });

  it('deve retornar noMatch quando distância vem como string acima do limite', async () => {
    chunkRepository.searchSimilarWithEpisode.mockResolvedValue([
      sampleChunk({ distance: '0.99' as unknown as number }),
    ]);

    const result = await service.ask('O que acharam do filme X?');

    expect(result.noMatch).toBe(true);
  });

  it('deve retornar noMatch quando não há chunks relevantes', async () => {
    chunkRepository.searchSimilarWithEpisode.mockResolvedValue([
      sampleChunk({ distance: 0.99 }),
    ]);

    const result = await service.ask('O que acharam do filme X?');

    expect(result.noMatch).toBe(true);
    expect(result.citations).toEqual([]);
    expect(result.reply).toBe(NO_MATCH_REPLY);
    expect(mockCallJson).toHaveBeenCalledTimes(1);
  });

  it('mostra só citações aprovadas pelo filtro de relevância', async () => {
    chunkRepository.searchSimilarWithEpisode.mockResolvedValue([
      sampleChunk({
        id: 'c1',
        startSec: 315,
        text: 'Rambo tem livro? Tem livro.',
      }),
      sampleChunk({
        id: 'c2',
        startSec: 262,
        text: 'falando de cinema IMAX e legenda',
        distance: 0.5,
      }),
    ]);
    mockCallJson.mockImplementation(async (_ai, params) => {
      if (params.systemPrompt.includes('classifica se a pergunta')) {
        return { offTopic: false };
      }
      return { citationIndexes: [1] };
    });

    const result = await service.ask('O que falaram sobre Rambo ter livro?');

    expect(result.citations).toHaveLength(1);
    expect(result.citations[0].startSec).toBe(315);
    expect(result.citations[0].quote).toContain('Rambo');
    expect(mockCallJson).toHaveBeenCalledTimes(2);
  });

  it('deve retornar reply e citações derivadas dos chunks', async () => {
    chunkRepository.searchSimilarWithEpisode.mockResolvedValue([
      sampleChunk(),
    ]);

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
    expect(mockCallJson).toHaveBeenCalledTimes(1);
    expect(aiService.call).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: expect.any(Array),
        systemPrompt: expect.stringContaining('Trechos do acervo'),
      }),
    );
  });

  it('deve limitar history às últimas N mensagens', async () => {
    chunkRepository.searchSimilarWithEpisode.mockResolvedValue([
      sampleChunk(),
    ]);
    const longHistory = Array.from({ length: 25 }, (_, i) => ({
      role: 'user' as const,
      content: `msg-${i}`,
    }));

    await service.ask('pergunta', longHistory);

    const ragCall = aiService.call.mock.calls.find(
      (call) =>
        typeof call[0]?.systemPrompt === 'string' &&
        call[0].systemPrompt.includes('Trechos do acervo'),
    );
    const callArgs = ragCall![0] as {
      messages: { content: string }[];
    };
    const historyContents = callArgs.messages
      .map((m) => m.content)
      .filter((c) => c.startsWith('msg-'));
    expect(historyContents).toHaveLength(20);
    expect(historyContents[0]).toBe('msg-5');
  });

  it('deve incluir history nas mensagens do LLM', async () => {
    chunkRepository.searchSimilarWithEpisode.mockResolvedValue([
      sampleChunk(),
    ]);

    await service.ask('E sobre o segundo filme?', [
      { role: 'user', content: 'Falaram de Harry Potter?' },
      { role: 'assistant', content: 'Sim, no episódio 1.' },
    ]);

    expect(aiService.call).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: expect.arrayContaining([
          expect.objectContaining({ content: 'Falaram de Harry Potter?' }),
          expect.objectContaining({ content: 'Sim, no episódio 1.' }),
          expect.objectContaining({ content: 'E sobre o segundo filme?' }),
        ]),
      }),
    );
  });
});
