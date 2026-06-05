import { normalizeChannelVideosUrl } from './yt-dlp.service';

describe('normalizeChannelVideosUrl', () => {
  it('appends /videos to channel handle url', () => {
    expect(normalizeChannelVideosUrl('https://www.youtube.com/@Choque')).toBe(
      'https://www.youtube.com/@Choque/videos',
    );
  });

  it('keeps playlist url unchanged', () => {
    const url =
      'https://www.youtube.com/playlist?list=PLA2Gd9vTv5MWbT1N-RVoTO7MHkfjKkYVV';
    expect(normalizeChannelVideosUrl(url)).toBe(url);
  });
});
