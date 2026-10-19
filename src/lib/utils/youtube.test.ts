import { describe, expect, it } from 'vitest';
import { extractYouTubeVideoId, toYouTubeEmbedUrl } from './youtube';

describe('YouTube URL utilities', () => {
  it.each([
    ['https://youtu.be/-3OCuE95zbk?si=share-token', '-3OCuE95zbk'],
    ['https://www.youtube.com/watch?v=-3OCuE95zbk&t=30', '-3OCuE95zbk'],
    ['https://www.youtube.com/embed/-3OCuE95zbk', '-3OCuE95zbk'],
    ['https://youtube.com/shorts/-3OCuE95zbk', '-3OCuE95zbk'],
    ['https://youtube.com/live/-3OCuE95zbk', '-3OCuE95zbk'],
    ['-3OCuE95zbk', '-3OCuE95zbk'],
  ])('extracts the video ID from %s', (input, expected) => {
    expect(extractYouTubeVideoId(input)).toBe(expected);
  });

  it('creates an iframe URL without preserving share query parameters', () => {
    expect(
      toYouTubeEmbedUrl('https://youtu.be/-3OCuE95zbk?si=share-token', {
        autoplay: true,
        mute: true,
      }),
    ).toBe(
      'https://www.youtube-nocookie.com/embed/-3OCuE95zbk?rel=0&autoplay=1&mute=1',
    );
  });

  it('rejects non-YouTube and malformed URLs', () => {
    expect(toYouTubeEmbedUrl('https://example.com/video')).toBeNull();
    expect(toYouTubeEmbedUrl('not-a-valid-video')).toBeNull();
  });
});
