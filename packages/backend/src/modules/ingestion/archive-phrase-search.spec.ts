import {
  buildPhraseIlikePatterns,
  parseEpisodeNumberFromTitle,
  textMatchesPhraseVariants,
} from './archive-phrase-search';

describe('archive-phrase-search', () => {
  it('parseEpisodeNumberFromTitle extracts # from title', () => {
    expect(
      parseEpisodeNumberFromTitle('CHOQUE DE CULTURA #3: Só Magia Top'),
    ).toBe(3);
    expect(parseEpisodeNumberFromTitle('Sem número')).toBeNull();
  });

  it('textMatchesPhraseVariants tolerates accents and token order', () => {
    expect(
      textMatchesPhraseVariants(
        'Aí o cara falou: achou errado otario!!!',
        'achou errado otário',
      ),
    ).toBe(true);
    expect(
      textMatchesPhraseVariants('Só inscreva no canal', 'achou errado otário'),
    ).toBe(false);
  });

  it('buildPhraseIlikePatterns produces searchable patterns', () => {
    const patterns = buildPhraseIlikePatterns('achou errado otário');
    expect(patterns).toContain('%achou%errado%otario%');
    expect(patterns.some((p) => p.includes('ot'))).toBe(true);
  });
});
