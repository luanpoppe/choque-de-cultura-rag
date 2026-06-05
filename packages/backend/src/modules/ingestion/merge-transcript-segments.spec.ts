import {
  mergeTranscriptSegmentsIntoChunks,
} from './merge-transcript-segments';
import type { SttSegment } from '@infrastructure/ai/openai-transcription';

describe('mergeTranscriptSegmentsIntoChunks', () => {
  const segments: SttSegment[] = [
    { startSec: 0, endSec: 25, text: 'Primeiro bloco de fala.' },
    { startSec: 25, endSec: 55, text: 'Segundo bloco no mesmo minuto.' },
    { startSec: 55, endSec: 90, text: 'Terceiro bloco passa de sessenta.' },
    { startSec: 90, endSec: 120, text: 'Quarto bloco continua.' },
  ];

  it('returns empty for no segments', () => {
    expect(mergeTranscriptSegmentsIntoChunks([])).toEqual([]);
  });

  it('merges segments into windows with real start/end', () => {
    const chunks = mergeTranscriptSegmentsIntoChunks(segments);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0]?.startSec).toBe(0);
    expect(chunks[0]?.text).toContain('Primeiro');
    for (const chunk of chunks) {
      expect(chunk.endSec).toBeGreaterThan(chunk.startSec);
      expect(chunk.text.length).toBeGreaterThan(0);
    }
  });

  it('emits one chunk per Whisper segment in the first fineGrainedHeadSec', () => {
    const early: SttSegment[] = [
      { startSec: 0, endSec: 8, text: 'Achou errado otário!' },
      { startSec: 8, endSec: 20, text: 'Continuação do trailer.' },
      { startSec: 200, endSec: 250, text: 'Muito depois no episódio.' },
      { startSec: 250, endSec: 310, text: 'Outro bloco tardio.' },
    ];
    const chunks = mergeTranscriptSegmentsIntoChunks(early, {
      fineGrainedHeadSec: 180,
      chunkDurationSec: 60,
      overlapRatio: 0,
    });
    expect(chunks[0]).toEqual({
      startSec: 0,
      endSec: 8,
      text: 'Achou errado otário!',
    });
    expect(chunks[1]).toEqual({
      startSec: 8,
      endSec: 20,
      text: 'Continuação do trailer.',
    });
    expect(chunks.some((c) => c.text.includes('Muito depois'))).toBe(true);
    expect(chunks.length).toBeGreaterThan(2);
  });

  it('uses floor/ceil for chunk boundaries', () => {
    const fine: SttSegment[] = [
      { startSec: 10.2, endSec: 30.7, text: 'A' },
      { startSec: 30.7, endSec: 70.1, text: 'B' },
    ];
    const chunks = mergeTranscriptSegmentsIntoChunks(fine, {
      fineGrainedHeadSec: 0,
      chunkDurationSec: 60,
      overlapRatio: 0,
    });
    expect(chunks[0]?.startSec).toBe(10);
    expect(chunks[0]?.endSec).toBe(71);
  });
});
