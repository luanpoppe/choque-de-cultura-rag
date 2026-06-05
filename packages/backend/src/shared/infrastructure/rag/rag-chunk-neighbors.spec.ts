import { mergeNeighborTexts } from './rag-chunk-neighbors';

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
