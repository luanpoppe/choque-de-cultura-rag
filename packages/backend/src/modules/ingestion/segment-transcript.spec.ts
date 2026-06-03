import { segmentTranscriptIntoChunks } from './segment-transcript';

describe('segmentTranscriptIntoChunks', () => {
  const transcript =
    'um dois tres quatro cinco seis sete oito nove dez onze doze treze quatorze quinze';

  it('returns empty for blank transcript', () => {
    expect(segmentTranscriptIntoChunks('', 120)).toEqual([]);
  });

  it('creates overlapping windows for long duration', () => {
    const segments = segmentTranscriptIntoChunks(transcript, 180);
    expect(segments.length).toBeGreaterThan(1);
    expect(segments[0]?.startSec).toBe(0);
    expect(segments[0]?.endSec).toBeLessThanOrEqual(60);
    const secondStart = segments[1]?.startSec ?? 0;
    expect(secondStart).toBeGreaterThan(0);
    expect(secondStart).toBeLessThan(60);
  });

  it('assigns non-empty text per segment', () => {
    const segments = segmentTranscriptIntoChunks(transcript, 120);
    for (const segment of segments) {
      expect(segment.text.length).toBeGreaterThan(0);
      expect(segment.endSec).toBeGreaterThan(segment.startSec);
    }
  });
});
