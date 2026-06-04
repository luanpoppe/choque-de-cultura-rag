import { coerceChunkDistance } from './rag-distance';

describe('coerceChunkDistance', () => {
  it('aceita número', () => {
    expect(coerceChunkDistance(0.42)).toBe(0.42);
  });

  it('converte string numérica do pgvector', () => {
    expect(coerceChunkDistance('0.55')).toBe(0.55);
  });

  it('rejeita valor inválido', () => {
    expect(() => coerceChunkDistance('n/a')).toThrow(/Invalid chunk distance/);
  });
});
