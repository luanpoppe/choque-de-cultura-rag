import { HttpException } from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common/interfaces';
import { ChatRateLimitGuard } from './chat-rate-limit.guard';
import { ChatRateLimitService } from './chat-rate-limit.service';

describe('ChatRateLimitGuard', () => {
  const envService = {
    getEnvs: jest.fn().mockReturnValue({
      CHAT_RATE_LIMIT_MAX: 2,
      CHAT_RATE_LIMIT_WINDOW_MS: 60_000,
    }),
  };
  const rateLimitService = new ChatRateLimitService();
  const guard = new ChatRateLimitGuard(envService, rateLimitService);

  const context = (ip = '192.0.2.1'): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ ip, headers: {} }),
      }),
    }) as ExecutionContext;

  beforeEach(() => {
    (rateLimitService as unknown as { hits: Map<string, number[]> }).hits.clear();
  });

  it('permite dentro do limite', () => {
    expect(guard.canActivate(context())).toBe(true);
    expect(guard.canActivate(context())).toBe(true);
  });

  it('retorna 429 ao exceder', () => {
    guard.canActivate(context('10.0.0.5'));
    guard.canActivate(context('10.0.0.5'));
    try {
      guard.canActivate(context('10.0.0.5'));
      fail('expected HttpException');
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getStatus()).toBe(429);
      expect((error as HttpException).getResponse()).toMatchObject({
        message:
          'Muitas perguntas em pouco tempo. Aguarde um minuto e tente de novo.',
        retryAfterSec: expect.any(Number),
      });
    }
  });
});
