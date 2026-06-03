/** Extrai ID de 11 caracteres de URL ou valor já normalizado. */
export function normalizeYoutubeVideoId(value: string): string {
  const trimmed = value.trim();
  const fromQuery = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/)?.[1];
  if (fromQuery) return fromQuery;
  const fromShort = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/)?.[1];
  if (fromShort) return fromShort;
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  throw new Error(`Invalid YouTube video id or URL: ${value}`);
}
