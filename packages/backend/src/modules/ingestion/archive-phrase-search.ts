import {
  buildPhraseIlikePatterns,
  normalizeForLexicalMatch,
} from '@/shared/lib/text-normalize';

export type PhraseMatchSource = 'chunk' | 'transcript_segment';

export type PhraseArchiveMatch = {
  source: PhraseMatchSource;
  episodeId: string;
  episodeTitle: string;
  youtubeVideoId: string;
  startSec: number;
  endSec: number | null;
  snippet: string;
  matchedPattern: string;
};

export const DEFAULT_VALIDATION_PHRASE = 'achou errado otário';

/** Extrai número do episódio do título (ex. "CHOQUE DE CULTURA #3: ..."). */
export function parseEpisodeNumberFromTitle(title: string): number | null {
  const match = title.match(/#\s*(\d+)/i);
  if (!match) return null;
  const n = Number.parseInt(match[1], 10);
  return Number.isFinite(n) ? n : null;
}

export function textMatchesPhraseVariants(
  text: string,
  phrase: string,
): boolean {
  const hay = normalizeForLexicalMatch(text);
  const needle = normalizeForLexicalMatch(phrase);
  if (!needle) return false;
  if (hay.includes(needle)) return true;

  const tokens = needle.split(' ').filter((t) => t.length >= 3);
  if (tokens.length >= 2) {
    return tokens.every((token) => hay.includes(token));
  }
  return false;
}

export { buildPhraseIlikePatterns, normalizeForLexicalMatch };
