/**
 * URL do YouTube no momento exato do trecho (arquitetura v1).
 */
export function buildWatchUrl(youtubeVideoId: string, startSec: number): string {
  const sec = Math.max(0, Math.floor(startSec));
  return `https://www.youtube.com/watch?v=${youtubeVideoId}&t=${sec}s`;
}
