import { resolveAudioFormat, resolveWhisperModel } from './openrouter-transcription';

describe('openrouter-transcription', () => {
  describe('resolveAudioFormat', () => {
    it('defaults to mp3', () => {
      expect(resolveAudioFormat()).toBe('mp3');
    });

    it('maps mime types', () => {
      expect(resolveAudioFormat('audio/webm')).toBe('webm');
    });
  });

  describe('resolveWhisperModel', () => {
    it('uses default when options model omitted', () => {
      expect(resolveWhisperModel(undefined, 'openai/whisper-large-v3')).toBe(
        'openai/whisper-large-v3',
      );
    });

    it('maps whisper-1 to openrouter slug', () => {
      expect(resolveWhisperModel('whisper-1', 'openai/whisper-large-v3')).toBe(
        'openai/whisper-1',
      );
    });
  });
});
