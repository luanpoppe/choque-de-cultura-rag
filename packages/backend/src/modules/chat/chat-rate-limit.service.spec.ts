import { ChatRateLimitService } from './chat-rate-limit.service';

describe('ChatRateLimitService', () => {
  const service = new ChatRateLimitService();
  const windowMs = 60_000;
  const max = 3;

  beforeEach(() => {
    (service as unknown as { hits: Map<string, number[]> }).hits.clear();
  });

  it('permite até max requisições na janela', () => {
    const t0 = 1_000_000;
    expect(service.tryConsume('ip-a', max, windowMs, t0).allowed).toBe(true);
    expect(service.tryConsume('ip-a', max, windowMs, t0 + 1).allowed).toBe(true);
    expect(service.tryConsume('ip-a', max, windowMs, t0 + 2).allowed).toBe(true);
    expect(service.tryConsume('ip-a', max, windowMs, t0 + 3).allowed).toBe(
      false,
    );
  });

  it('isola por chave', () => {
    const t0 = 2_000_000;
    for (let i = 0; i < max; i++) {
      expect(service.tryConsume('ip-a', max, windowMs, t0 + i).allowed).toBe(
        true,
      );
    }
    expect(service.tryConsume('ip-b', max, windowMs, t0).allowed).toBe(true);
  });

  it('libera após expirar a janela', () => {
    const t0 = 3_000_000;
    for (let i = 0; i < max; i++) {
      service.tryConsume('ip-a', max, windowMs, t0 + i);
    }
    const blocked = service.tryConsume('ip-a', max, windowMs, t0 + 1000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSec).toBeGreaterThan(0);

    expect(
      service.tryConsume('ip-a', max, windowMs, t0 + windowMs + 1).allowed,
    ).toBe(true);
  });

  it('maxRequests <= 0 desabilita limite', () => {
    for (let i = 0; i < 50; i++) {
      expect(service.tryConsume('ip-a', 0, windowMs, i).allowed).toBe(true);
    }
  });
});
