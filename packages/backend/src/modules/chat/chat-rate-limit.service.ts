import { Injectable } from '@nestjs/common';

export type RateLimitAttempt = {
  allowed: boolean;
  retryAfterSec?: number;
};

/**
 * Janela deslizante em memória por chave (ex.: IP). PoC v1 — sem Redis.
 */
@Injectable()
export class ChatRateLimitService {
  private readonly hits = new Map<string, number[]>();

  tryConsume(
    key: string,
    maxRequests: number,
    windowMs: number,
    now = Date.now(),
  ): RateLimitAttempt {
    if (maxRequests <= 0) {
      return { allowed: true };
    }

    const windowStart = now - windowMs;
    const timestamps = (this.hits.get(key) ?? []).filter((t) => t > windowStart);
    if (timestamps.length === 0) {
      this.hits.delete(key);
    }

    if (timestamps.length >= maxRequests) {
      const oldest = timestamps[0] ?? now;
      const retryAfterSec = Math.max(
        1,
        Math.ceil((oldest + windowMs - now) / 1000),
      );
      this.hits.set(key, timestamps);
      return { allowed: false, retryAfterSec };
    }

    timestamps.push(now);
    this.hits.set(key, timestamps);
    return { allowed: true };
  }
}
