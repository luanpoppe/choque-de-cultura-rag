import {
  resolveAudioFormat,
  resolveWhisperModel,
  transcribeViaOpenRouter,
} from './openrouter-transcription';

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

  describe('transcribeViaOpenRouter', () => {
    it('posts base64 audio and returns text', async () => {
      const fetchMock = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ text: 'olá mundo' }),
      });
      global.fetch = fetchMock as typeof fetch;

      const text = await transcribeViaOpenRouter({
        apiKey: 'key',
        model: 'openai/whisper-large-v3',
        audioBase64: Buffer.from('audio').toString('base64'),
        format: 'mp3',
        language: 'pt',
      });

      expect(text).toBe('olá mundo');
      const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(fetchMock.mock.calls[0]?.[0]).toBe(
        'https://openrouter.ai/api/v1/audio/transcriptions',
      );
      expect(init.method).toBe('POST');
      expect(init.headers).toMatchObject({ Authorization: 'Bearer key' });
      expect(init.signal).toBeDefined();
    });

    it('throws when response has no text', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      }) as typeof fetch;

      await expect(
        transcribeViaOpenRouter({
          apiKey: 'key',
          model: 'openai/whisper-large-v3',
          audioBase64: 'YQ==',
          format: 'mp3',
        }),
      ).rejects.toThrow(/no text/i);
    });
  });
});
