import { EnvService } from './env.service';

describe('EnvService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should require DATABASE_URL', () => {
    delete process.env.DATABASE_URL;
    const service = new EnvService();
    expect(() => service.getEnvs()).toThrow(/DATABASE_URL/);
  });

  it('should parse valid env vars', () => {
    process.env.DATABASE_URL =
      'postgresql://choque:choque@localhost:6017/choque_rag';
    process.env.PORT = '4000';
    const service = new EnvService();
    const envs = service.getEnvs();
    expect(envs.DATABASE_URL).toContain('choque_rag');
    expect(envs.PORT).toBe(4000);
  });
});
