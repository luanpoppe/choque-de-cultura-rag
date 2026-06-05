import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const req = context.switchToHttp().getRequest<Request>();
    const { method, url } = req;
    const startedAt = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const res = context.switchToHttp().getResponse<Response>();
          this.logger.log(
            `${method} ${url} ${res.statusCode} ${Date.now() - startedAt}ms`,
          );
        },
        error: (err: { status?: number; getStatus?: () => number }) => {
          const status =
            typeof err?.getStatus === 'function'
              ? err.getStatus()
              : (err?.status ?? 500);
          this.logger.warn(
            `${method} ${url} ${status} ${Date.now() - startedAt}ms`,
          );
        },
      }),
    );
  }
}
