import { Test, TestingModule } from '@nestjs/testing';
import { AI, AIAudio, AIEmbeddings } from '@luanpoppe/ai';
import { EnvService } from '@core/env.service';
import { AiService, toAIEmbeddingModelName } from './ai.service';

jest.mock('@luanpoppe/ai', () => ({
  AI: jest.fn().mockImplementation(() => ({
    call: jest.fn(),
  })),
  AIEmbeddings: {
    embedDocuments: jest.fn().mockResolvedValue([[0.1, 0.2]]),
    embedQuery: jest.fn().mockResolvedValue([0.1, 0.2]),
  },
  AIAudio: {
    transcribeOpenRouter: jest.fn(),
  },
}));

const mockEnvs = {
  DATABASE_URL: 'postgresql://choque:choque@localhost:6017/choque_rag',
  PORT: 3000,
  OPENROUTER_API_KEY: 'test-openrouter-key',
  OPENAI_API_KEY: 'sk-test-openai',
  OPENAI_WHISPER_MODEL: 'whisper-1',
  EMBEDDING_MODEL: 'openai/text-embedding-3-small',
  WHISPER_MODEL: 'openai/whisper-large-v3',
};

describe('toAIEmbeddingModelName', () => {
  it('prefixes openai/* models for OpenRouter routing', () => {
    expect(toAIEmbeddingModelName('openai/text-embedding-3-small')).toBe(
      'openrouter/openai/text-embedding-3-small',
    );
  });

  it('keeps openrouter/* models unchanged', () => {
    expect(
      toAIEmbeddingModelName('openrouter/openai/text-embedding-3-small'),
    ).toBe('openrouter/openai/text-embedding-3-small');
  });
});

describe('AiService', () => {
  let service: AiService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        {
          provide: EnvService,
          useValue: { getEnvs: () => mockEnvs },
        },
      ],
    }).compile();

    service = module.get(AiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should construct AI client with keys from EnvService', () => {
    expect(AI).toHaveBeenCalledWith({
      openRouterApiKey: mockEnvs.OPENROUTER_API_KEY,
      openAIApiKey: mockEnvs.OPENAI_API_KEY,
      googleGeminiToken: undefined,
    });
  });

  it('should embed documents via AIEmbeddings', async () => {
    const vectors = await service.embedDocuments(['trecho do episódio']);
    expect(vectors).toEqual([[0.1, 0.2]]);
    expect(AIEmbeddings.embedDocuments).toHaveBeenCalledWith(
      ['trecho do episódio'],
      {
        model: 'openrouter/openai/text-embedding-3-small',
        openRouterAllowAllProviders: true,
      },
      {
        openRouterApiKey: mockEnvs.OPENROUTER_API_KEY,
        openAIApiKey: mockEnvs.OPENAI_API_KEY,
        googleGeminiToken: undefined,
      },
    );
  });

  it('should transcribe via AIAudio OpenRouter', async () => {
    jest.mocked(AIAudio.transcribeOpenRouter).mockResolvedValue({
      text: 'transcrição',
    });
    const audio = Buffer.from('fake-audio');
    const result = await service.transcribeWithWhisper(audio, {
      model: 'whisper-1',
      languageIn2Digits: 'pt',
    });
    expect(result).toBe('transcrição');
    expect(AIAudio.transcribeOpenRouter).toHaveBeenCalledWith(
      audio,
      {
        model: 'openai/whisper-1',
        format: 'mp3',
        language: 'pt',
        openRouterAllowAllProviders: true,
      },
      mockEnvs.OPENROUTER_API_KEY,
    );
  });
});
