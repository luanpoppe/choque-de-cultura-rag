import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { EnvService } from '@core/env.service';
import { ChatRateLimitService } from './chat-rate-limit.service';
import { getClientIp } from './request-client-ip';

export const CHAT_RATE_LIMIT_MESSAGE =
  'Muitas perguntas em pouco tempo. Aguarde um minuto e tente de novo.';

@Injectable()
export class ChatRateLimitGuard implements CanActivate {
  constructor(
    private readonly envService: EnvService,
    private readonly rateLimitService: ChatRateLimitService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      ip?: string;
      headers: Record<string, string | string[] | undefined>;
    }>();
    const envs = this.envService.getEnvs();
    const clientKey = getClientIp(request);
    const attempt = this.rateLimitService.tryConsume(
      clientKey,
      envs.CHAT_RATE_LIMIT_MAX,
      envs.CHAT_RATE_LIMIT_WINDOW_MS,
    );

    if (attempt.allowed) {
      return true;
    }

    throw new HttpException(
      {
        message: CHAT_RATE_LIMIT_MESSAGE,
        retryAfterSec: attempt.retryAfterSec,
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
