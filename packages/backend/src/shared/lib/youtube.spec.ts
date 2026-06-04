import { buildWatchUrl } from './youtube';

describe('buildWatchUrl', () => {
  it('monta URL com timestamp em segundos', () => {
    expect(buildWatchUrl('4u1w1UnqI0Y', 120)).toBe(
      'https://www.youtube.com/watch?v=4u1w1UnqI0Y&t=120s',
    );
  });

  it('normaliza startSec negativo para zero', () => {
    expect(buildWatchUrl('abc', -5)).toBe(
      'https://www.youtube.com/watch?v=abc&t=0s',
    );
  });
});
