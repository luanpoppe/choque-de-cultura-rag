import {
  buildChunkContextText,
  mergeNeighborTexts,
} from './rag-chunk-neighbors';
import type { ChunkRepository } from '@infrastructure/vector-store/chunk.repository';

describe('buildChunkContextText', () => {
  it('retorna só o anchor quando neighborCount é 0', async () => {
    const chunkRepository = {
      findTemporalNeighbors: jest.fn(),
    } as unknown as ChunkRepository;

    const result = await buildChunkContextText(
      { episodeId: 'ep-1', startSec: 10, text: '  Âncora.  ' },
      chunkRepository,
      0,
    );

    expect(result).toBe('Âncora.');
    expect(chunkRepository.findTemporalNeighbors).not.toHaveBeenCalled();
  });

  it('busca vizinhos e monta contexto expandido', async () => {
    const chunkRepository = {
      findTemporalNeighbors: jest.fn().mockResolvedValue({
        before: [{ id: 'b1', text: 'Antes.', startSec: 0, endSec: 5 }],
        after: [{ id: 'a1', text: 'Depois.', startSec: 20, endSec: 25 }],
      }),
    } as unknown as ChunkRepository;

    const result = await buildChunkContextText(
      { episodeId: 'ep-1', startSec: 10, text: 'Meio.' },
      chunkRepository,
      2,
    );

    expect(chunkRepository.findTemporalNeighbors).toHaveBeenCalledWith(
      'ep-1',
      10,
      { before: 2, after: 2 },
    );
    expect(result).toBe('Antes. Meio. Depois.');
  });
});

describe('mergeNeighborTexts', () => {
  it('concatena before, anchor e after em ordem', () => {
    expect(
      mergeNeighborTexts(
        [{ text: 'Antes.' }],
        { text: 'Meio.' },
        [{ text: 'Depois.' }],
      ),
    ).toBe('Antes. Meio. Depois.');
  });

  it('ignora textos vazios', () => {
    expect(
      mergeNeighborTexts([{ text: '  ' }], { text: 'Só.' }, []),
    ).toBe('Só.');
  });
});
