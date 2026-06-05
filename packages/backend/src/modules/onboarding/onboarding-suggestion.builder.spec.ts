import {
  buildNaturalSuggestion,
  extractTopicFromChunk,
  shortenEpisodeTitle,
} from './onboarding-suggestion.builder';

describe('onboarding-suggestion.builder', () => {
  const episodeTitle =
    'CHOQUE DE CULTURA #1: Harry Potter Sem Harry Potter';

  it('encurta título do episódio', () => {
    expect(shortenEpisodeTitle(episodeTitle)).toBe(
      'Harry Potter Sem Harry Potter',
    );
  });

  it('extrai entidade conhecida do trecho', () => {
    const topic = extractTopicFromChunk(
      'pra todo mundo, você tem que ler o livro. Rambo tem livro?',
      episodeTitle,
    );
    expect(topic).toMatch(/Rambo/i);
  });

  it('gera pergunta curta sem copiar trecho longo', () => {
    const suggestion = buildNaturalSuggestion(
      'Você que tava procurando um programa de cultura, encontrou, porra! Choque de Cultura',
      episodeTitle,
      0,
    );
    expect(suggestion.length).toBeLessThanOrEqual(68);
    expect(suggestion).not.toMatch(/encontrou, porra/i);
    expect(suggestion).toMatch(/^O que falaram de /);
  });

  it('varia templates entre índices', () => {
    const a = buildNaturalSuggestion('falando de Rambo no filme', episodeTitle, 0);
    const b = buildNaturalSuggestion('falando de Rambo no filme', episodeTitle, 1);
    expect(a).not.toBe(b);
  });
});
