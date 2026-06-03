import { UnauthorizedException } from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common/interfaces';
import { IngestSecretGuard } from './ingest-secret.guard';

describe('IngestSecretGuard', () => {
  const envService = {
    getEnvs: jest.fn().mockReturnValue({ INGEST_SECRET: 'top-secret' }),
  };

  const guard = new IngestSecretGuard(envService);

  const context = (secret?: string): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({
          headers: secret ? { 'x-ingest-secret': secret } : {},
        }),
      }),
    }) as ExecutionContext;

  it('allows matching secret', () => {
    expect(guard.canActivate(context('top-secret'))).toBe(true);
  });

  it('rejects missing or wrong secret', () => {
    expect(() => guard.canActivate(context())).toThrow(UnauthorizedException);
    expect(() => guard.canActivate(context('wrong'))).toThrow(
      UnauthorizedException,
    );
  });
});
