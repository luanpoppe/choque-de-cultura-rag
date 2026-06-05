import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { LoggingInterceptor } from './logging.interceptor';

describe('LoggingInterceptor', () => {
  const interceptor = new LoggingInterceptor();
  let logSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    logSpy = jest.spyOn(interceptor['logger'], 'log').mockImplementation();
    warnSpy = jest.spyOn(interceptor['logger'], 'warn').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  function httpContext(statusCode = 200): ExecutionContext {
    return {
      getType: () => 'http',
      switchToHttp: () => ({
        getRequest: () => ({ method: 'POST', url: '/api/chat' }),
        getResponse: () => ({ statusCode }),
      }),
    } as ExecutionContext;
  }

  it('loga request HTTP bem-sucedida', (done) => {
    interceptor
      .intercept(httpContext(200), { handle: () => of({ ok: true }) })
      .subscribe({
        complete: () => {
          expect(logSpy).toHaveBeenCalledWith(
            expect.stringMatching(/^POST \/api\/chat 200 \d+ms$/),
          );
          done();
        },
      });
  });

  it('loga warn em erro HTTP', (done) => {
    const err = { status: 429 };
    interceptor
      .intercept(httpContext(), {
        handle: () => throwError(() => err),
      } as CallHandler)
      .subscribe({
        error: () => {
          expect(warnSpy).toHaveBeenCalledWith(
            expect.stringMatching(/^POST \/api\/chat 429 \d+ms$/),
          );
          done();
        },
      });
  });
});
