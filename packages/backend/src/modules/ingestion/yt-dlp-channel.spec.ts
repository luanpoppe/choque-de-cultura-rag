import { normalizeChannelVideosUrl } from './yt-dlp.service';

describe('normalizeChannelVideosUrl', () => {
  it('appends /videos to channel handle url', () => {
    expect(normalizeChannelVideosUrl('https://www.youtube.com/@Choque')).toBe(
      'https://www.youtube.com/@Choque/videos',
    );
  });

  it('keeps playlist url unchanged', () => {
    const url = 'https://www.youtube.com/playlist?list=PLtest';
    expect(normalizeChannelVideosUrl(url)).toBe(url);
  });
});
