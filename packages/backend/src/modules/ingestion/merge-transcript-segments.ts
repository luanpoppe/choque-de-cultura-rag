import type { SttSegment } from '@infrastructure/ai/openai-transcription';

export type { SttSegment };

const DEFAULT_CHUNK_DURATION_SEC = 60;
const DEFAULT_OVERLAP_RATIO = 0.25;
/** Início do vídeo: 1 segmento Whisper = 1 chunk indexado (melhor retrieval de memes curtos). */
export const DEFAULT_FINE_GRAINED_HEAD_SEC = 180;
/** Segundos de fala vizinha incluídos em cada chunk da zona fina (contexto para RAG e cards). */
export const DEFAULT_HEAD_CONTEXT_SEC = 20;

export type MergeTranscriptOptions = {
  chunkDurationSec?: number;
  overlapRatio?: number;
  /** Segundos desde o início com chunk 1:1 por segmento STT; 0 desliga. */
  fineGrainedHeadSec?: number;
  /** ±N segundos de segmentos vizinhos no texto de cada chunk da zona fina. */
  headContextSec?: number;
};

/**
 * Agrupa segmentos STT em chunks para embedding.
 * No início do vídeo (fineGrainedHeadSec), cada segmento Whisper vira um chunk ancorado
 * no timestamp do segmento, com texto expandido por headContextSec de vizinhos;
 * depois, janelas com overlap configurável (default 25%).
 */
export function mergeTranscriptSegmentsIntoChunks(
  segments: SttSegment[],
  options?: MergeTranscriptOptions,
): SttSegment[] {
  const sorted = [...segments]
    .filter((s) => s.text.trim().length > 0)
    .sort((a, b) => a.startSec - b.startSec);

  if (sorted.length === 0) return [];

  const fineGrainedHeadSec =
    options?.fineGrainedHeadSec ?? DEFAULT_FINE_GRAINED_HEAD_SEC;

  if (fineGrainedHeadSec <= 0) {
    return mergeSegmentsIntoWindows(sorted, options);
  }

  const headSegs = sorted.filter((s) => s.startSec < fineGrainedHeadSec);
  const tailSegs = sorted.filter((s) => s.startSec >= fineGrainedHeadSec);

  const headContextSec = options?.headContextSec ?? DEFAULT_HEAD_CONTEXT_SEC;
  const headChunks = buildFineGrainedHeadChunks(headSegs, headContextSec);

  return [...headChunks, ...mergeSegmentsIntoWindows(tailSegs, options)];
}

/** Um chunk por segmento STT no início, com fala vizinha ±headContextSec no texto. */
export function buildFineGrainedHeadChunks(
  headSegs: SttSegment[],
  headContextSec: number,
): SttSegment[] {
  if (headSegs.length === 0) return [];

  return headSegs.map((anchor) => {
    const windowStart = anchor.startSec - headContextSec;
    const windowEnd = anchor.endSec + headContextSec;
    const neighbors = headSegs.filter(
      (s) => s.endSec > windowStart && s.startSec < windowEnd,
    );
    const text = neighbors
      .map((s) => s.text.trim())
      .filter(Boolean)
      .join(' ');

    return {
      startSec: Math.floor(anchor.startSec),
      endSec: Math.ceil(
        Math.max(anchor.endSec, ...neighbors.map((s) => s.endSec)),
      ),
      text,
    };
  });
}

/** Janelas temporais com overlap (resto do vídeo após a zona fina). */
export function mergeSegmentsIntoWindows(
  segments: SttSegment[],
  options?: MergeTranscriptOptions,
): SttSegment[] {
  const chunkDurationSec =
    options?.chunkDurationSec ?? DEFAULT_CHUNK_DURATION_SEC;
  const overlapRatio = options?.overlapRatio ?? DEFAULT_OVERLAP_RATIO;
  const overlapSec = chunkDurationSec * overlapRatio;

  if (segments.length === 0) return [];

  const chunks: SttSegment[] = [];
  let buffer: SttSegment[] = [];

  const bufferSpanEnd = (): number =>
    buffer.length > 0 ? buffer[buffer.length - 1].endSec : 0;
  const bufferSpanStart = (): number =>
    buffer.length > 0 ? buffer[0].startSec : 0;

  const flush = (): void => {
    if (buffer.length === 0) return;
    const text = buffer
      .map((s) => s.text.trim())
      .filter(Boolean)
      .join(' ');
    if (text.length > 0) {
      chunks.push({
        startSec: Math.floor(bufferSpanStart()),
        endSec: Math.ceil(bufferSpanEnd()),
        text,
      });
    }
    const chunkEnd = bufferSpanEnd();
    buffer = buffer.filter((s) => s.endSec > chunkEnd - overlapSec);
  };

  for (const seg of segments) {
    const projectedEnd = Math.max(bufferSpanEnd(), seg.endSec);
    const projectedSpan = projectedEnd - bufferSpanStart();

    if (buffer.length > 0 && projectedSpan > chunkDurationSec) {
      flush();
    }
    buffer.push(seg);
  }

  flush();
  return chunks;
}
