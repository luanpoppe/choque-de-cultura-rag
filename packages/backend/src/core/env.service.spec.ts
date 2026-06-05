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
    process.env.OPENROUTER_API_KEY = 'or-test';
    process.env.INGEST_SECRET = 'test-ingest-secret';
    const service = new EnvService();
    const envs = service.getEnvs();
    expect(envs.DATABASE_URL).toContain('choque_rag');
    expect(envs.PORT).toBe(4000);
    expect(envs.OPENROUTER_API_KEY).toBe('or-test');
    expect(envs.EMBEDDING_MODEL).toBe('openai/text-embedding-3-small');
    expect(envs.WHISPER_MODEL).toBe('openai/whisper-1');
    expect(envs.OPENAI_WHISPER_MODEL).toBe('whisper-1');
  });

  it('should require OPENROUTER_API_KEY', () => {
    process.env.DATABASE_URL =
      'postgresql://choque:choque@localhost:6017/choque_rag';
    delete process.env.OPENROUTER_API_KEY;
    const service = new EnvService();
    expect(() => service.getEnvs()).toThrow();
  });
});
