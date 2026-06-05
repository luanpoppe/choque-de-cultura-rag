/** Normaliza texto para comparação lexical (sem acentos, minúsculas). */
export function normalizeForLexicalMatch(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Padrões SQL ILIKE (%token%) a partir de uma frase (tokens com 3+ chars). */
export function buildPhraseIlikePatterns(phrase: string): string[] {
  const normalized = normalizeForLexicalMatch(phrase);
  const tokens = normalized.split(' ').filter((t) => t.length >= 3);
  if (tokens.length === 0) return [`%${normalized.replace(/\s+/g, '%')}%`];

  const patterns = new Set<string>();
  patterns.add(`%${tokens.join('%')}%`);
  if (tokens.length >= 2) {
    patterns.add(`%${tokens.slice(0, 2).join('%')}%`);
  }
  for (const token of tokens) {
    patterns.add(`%${token}%`);
  }
  return [...patterns];
}
