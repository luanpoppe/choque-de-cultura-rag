jest.mock('@luanpoppe/ai', () => ({
  AIMessages: {
    human: (content: string) => ({ role: 'human', content }),
  },
}));
jest.mock('@infrastructure/ai/ai-json-call', () => ({
  callJsonOutput: jest.fn(),
}));

import { callJsonOutput } from '@infrastructure/ai/ai-json-call';
import type { SimilarChunkWithEpisode } from '@infrastructure/vector-store/chunk.repository';
import {
  findCitationIndexesMentionedInReply,
  mergeCitationIndexes,
  pickChunksByIndexes,
  selectCitationIndexes,
} from './rag-citation-filter';

const mockCallJson = callJsonOutput as jest.Mock;

const chunks: SimilarChunkWithEpisode[] = [
  {
    id: 'c1',
    episodeId: 'e2',
    text: 'Ele tem talento pra isso! Não é um Transformers.',
    startSec: 120,
    endSec: 180,
    distance: 0.2,
    episodeTitle: 'CHOQUE DE CULTURA #2: Só Magia Top',
    youtubeVideoId: 'vid2',
    durationSec: 400,
  },
  {
    id: 'c2',
    episodeId: 'e1',
    text: 'Ele tem talento pra isso, Rony?',
    startSec: 262,
    endSec: 322,
    distance: 0.35,
    episodeTitle: 'CHOQUE DE CULTURA #1: Harry Potter Sem Harry Potter',
    youtubeVideoId: 'vid1',
    durationSec: 400,
  },
];

describe('rag-citation-filter', () => {
  beforeEach(() => jest.clearAllMocks());

  it('com um chunk retorna [1] sem chamar IA', async () => {
    const result = await selectCitationIndexes(
      {} as never,
      'openrouter/deepseek/deepseek-v4-flash',
      'pergunta',
      'resposta',
      [chunks[0]],
    );
    expect(result).toEqual([1]);
    expect(mockCallJson).not.toHaveBeenCalled();
  });

  it('filtra índices retornados pela IA', async () => {
    mockCallJson.mockResolvedValue({ citationIndexes: [1] });

    const result = await selectCitationIndexes(
      {} as never,
      'openrouter/deepseek/deepseek-v4-flash',
      'Rambo tem livro?',
      'Sim, confirmaram que Rambo tem livro.',
      chunks,
    );

    expect(result).toEqual([1]);
    expect(pickChunksByIndexes(chunks, result)[0].startSec).toBe(120);
  });

  it('inclui segundo card quando IA seleciona dois trechos relevantes', async () => {
    mockCallJson.mockResolvedValue({ citationIndexes: [1, 2] });

    const result = await selectCitationIndexes(
      {} as never,
      'openrouter/deepseek/deepseek-v4-flash',
      'ele tem talento pra isso',
      'No Episódio #2 (Só Magia Top) e no Episódio #1 (Harry Potter Sem Harry Potter).',
      chunks,
    );

    expect(result).toEqual([1, 2]);
  });

  it('detecta episódios citados na resposta', () => {
    const indexes = findCitationIndexesMentionedInReply(
      'No Episódio #2 (Só Magia Top) e no Episódio #1 (Harry Potter Sem Harry Potter).',
      chunks,
    );
    expect(indexes).toEqual(expect.arrayContaining([1, 2]));
  });

  it('une índices da IA com episódios mencionados', () => {
    expect(mergeCitationIndexes([1], [2])).toEqual([1, 2]);
  });

  it('respeita lista vazia quando IA não encontra evidência', async () => {
    mockCallJson.mockResolvedValue({ citationIndexes: [] });

    const result = await selectCitationIndexes(
      {} as never,
      'openrouter/deepseek/deepseek-v4-flash',
      'q',
      'r',
      chunks,
    );

    expect(result).toEqual([]);
  });

  it('limita ao máximo de cards configurado', async () => {
    const manyChunks = Array.from({ length: 5 }, (_, i) => ({
      ...chunks[0],
      id: `c${i}`,
      startSec: i * 60,
    }));
    mockCallJson.mockResolvedValue({
      citationIndexes: [1, 2, 3, 4, 5],
    });

    const result = await selectCitationIndexes(
      {} as never,
      'openrouter/deepseek/deepseek-v4-flash',
      'q',
      'r',
      manyChunks,
    );

    expect(result).toHaveLength(3);
    expect(result).toEqual([1, 2, 3]);
  });

  it('fallback para [1] quando chamada JSON falha', async () => {
    mockCallJson.mockResolvedValue(null);

    const result = await selectCitationIndexes(
      {} as never,
      'openrouter/deepseek/deepseek-v4-flash',
      'q',
      'r',
      chunks,
    );

    expect(result).toEqual([1]);
  });
});
