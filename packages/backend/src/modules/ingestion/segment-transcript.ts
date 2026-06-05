export type TranscriptSegment = {
  startSec: number;
  endSec: number;
  text: string;
};

const DEFAULT_CHUNK_DURATION_SEC = 60;
const DEFAULT_OVERLAP_RATIO = 0.125;

/**
 * Divide transcrição em janelas temporais ~60s com overlap 10–15%.
 * Timestamps são proporcionais à duração do vídeo (fallback legado).
 * Pipeline de ingestão usa mergeTranscriptSegmentsIntoChunks com segmentos STT reais (story 1.6).
 */
export function segmentTranscriptIntoChunks(
  transcript: string,
  durationSec: number,
  options?: {
    chunkDurationSec?: number;
    overlapRatio?: number;
  },
): TranscriptSegment[] {
  const chunkDurationSec =
    options?.chunkDurationSec ?? DEFAULT_CHUNK_DURATION_SEC;
  const overlapRatio = options?.overlapRatio ?? DEFAULT_OVERLAP_RATIO;
  const strideSec = chunkDurationSec * (1 - overlapRatio);

  const normalized = transcript.trim().replace(/\s+/g, ' ');
  if (!normalized || durationSec <= 0) {
    return [];
  }

  const windows: { startSec: number; endSec: number }[] = [];
  for (let start = 0; start < durationSec; start += strideSec) {
    const end = Math.min(start + chunkDurationSec, durationSec);
    windows.push({
      startSec: Math.floor(start),
      endSec: Math.ceil(end),
    });
    if (end >= durationSec) break;
  }

  const words = normalized.split(' ');
  const totalWords = words.length;

  return windows
    .map(({ startSec, endSec }) => {
      const startIdx = Math.floor((startSec / durationSec) * totalWords);
      const endIdx = Math.min(
        totalWords,
        Math.max(startIdx + 1, Math.ceil((endSec / durationSec) * totalWords)),
      );
      const text = words.slice(startIdx, endIdx).join(' ');
      return { startSec, endSec, text };
    })
    .filter((segment) => segment.text.length > 0);
}
