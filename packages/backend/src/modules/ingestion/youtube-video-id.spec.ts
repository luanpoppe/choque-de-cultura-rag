import { normalizeYoutubeVideoId } from './youtube-video-id';

describe('normalizeYoutubeVideoId', () => {
  it('accepts bare id', () => {
    expect(normalizeYoutubeVideoId('dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('extracts id from watch url', () => {
    expect(
      normalizeYoutubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
    ).toBe('dQw4w9WgXcQ');
  });

  it('throws on invalid value', () => {
    expect(() => normalizeYoutubeVideoId('curto')).toThrow(/Invalid/);
  });
});
