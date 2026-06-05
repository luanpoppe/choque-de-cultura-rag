import {
  resolveCitationIndexes,
  sanitizeCitationIndexes,
} from './rag-unified-response';

describe('rag-unified-response', () => {
  it('sanitizeCitationIndexes filtra inválidos e limita quantidade', () => {
    expect(sanitizeCitationIndexes([1, 2, 99, 2, 3, 4], 3, 2)).toEqual([
      1, 2,
    ]);
  });

  it('resolveCitationIndexes retorna vazio se off-topic', () => {
    expect(resolveCitationIndexes([1], 2, true)).toEqual([]);
  });

  it('resolveCitationIndexes usa [1] com um chunk se modelo omitir índices', () => {
    expect(resolveCitationIndexes([], 1, false)).toEqual([1]);
  });

  it('resolveCitationIndexes respeita lista vazia com vários chunks', () => {
    expect(resolveCitationIndexes([], 3, false)).toEqual([]);
  });
});
