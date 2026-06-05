jest.mock('@luanpoppe/ai', () => ({
  AIAudio: {
    transcribeDetailedOpenAI: jest.fn(),
  },
}));

import {
  offsetSttSegments,
  OPENAI_WHISPER_MAX_FILE_BYTES,
  parseWhisperVerboseJson,
  splitAudioFileIfNeeded,
} from './openai-transcription';

describe('openai-transcription', () => {
  describe('parseWhisperVerboseJson', () => {
    it('parses segments from verbose_json', () => {
      const result = parseWhisperVerboseJson({
        text: 'Olá mundo',
        segments: [
          { start: 1.5, end: 4.2, text: ' Olá' },
          { start: 4.2, end: 6.0, text: ' mundo' },
        ],
      });
      expect(result.text).toBe('Olá mundo');
      expect(result.segments).toHaveLength(2);
      expect(result.segments[0]).toEqual({
        startSec: 1.5,
        endSec: 4.2,
        text: 'Olá',
      });
    });
  });

  describe('offsetSttSegments', () => {
    it('offsets segment times for split audio parts', () => {
      expect(
        offsetSttSegments([{ startSec: 0, endSec: 5, text: 'a' }], 120),
      ).toEqual([{ startSec: 120, endSec: 125, text: 'a' }]);
    });
  });

  describe('splitAudioFileIfNeeded', () => {
    it('returns single part when under size limit', async () => {
      const parts = await splitAudioFileIfNeeded('/tmp/x.mp3', 3600, 1024);
      expect(parts).toHaveLength(1);
      expect(parts[0]?.offsetSec).toBe(0);
    });

    it('requires duration for oversized files', async () => {
      await expect(
        splitAudioFileIfNeeded(
          '/tmp/x.mp3',
          0,
          OPENAI_WHISPER_MAX_FILE_BYTES + 1,
        ),
      ).rejects.toThrow(/durationSec/);
    });
  });
});
