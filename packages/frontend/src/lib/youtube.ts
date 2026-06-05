export function buildWatchUrl(youtubeVideoId: string, startSec: number): string {
  const sec = Math.max(0, Math.floor(startSec));
  return `https://www.youtube.com/watch?v=${youtubeVideoId}&t=${sec}s`;
}

export function formatTimestamp(startSec: number, durationSec?: number): string {
  const format = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };
  const start = format(startSec);
  if (durationSec != null && durationSec > 0) {
    return `${start} · ${format(durationSec)} total`;
  }
  return start;
}
