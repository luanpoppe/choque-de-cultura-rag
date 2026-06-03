import { timingSafeEqual } from 'node:crypto';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { EnvService } from '@core/env.service';

const HEADER_NAME = 'x-ingest-secret';

@Injectable()
export class IngestSecretGuard implements CanActivate {
  constructor(private readonly envService: EnvService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
    }>();
    const provided = request.headers[HEADER_NAME];
    const secret = provided
      ? Array.isArray(provided)
        ? provided[0]
        : provided
      : undefined;

    if (!secret || !this.matchesSecret(secret)) {
      throw new UnauthorizedException('Invalid or missing X-Ingest-Secret');
    }
    return true;
  }

  private matchesSecret(provided: string): boolean {
    const expected = this.envService.getEnvs().INGEST_SECRET;
    const providedBuf = Buffer.from(provided);
    const expectedBuf = Buffer.from(expected);
    if (providedBuf.length !== expectedBuf.length) {
      return false;
    }
    return timingSafeEqual(providedBuf, expectedBuf);
  }
}
