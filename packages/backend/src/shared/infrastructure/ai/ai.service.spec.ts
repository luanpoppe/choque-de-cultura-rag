import { Test, TestingModule } from '@nestjs/testing';
import { OpenAIEmbeddings } from '@langchain/openai';
import { AI } from '@luanpoppe/ai';
import { EnvService } from '@core/env.service';
import { AiService } from './ai.service';
import * as openrouterTranscription from './openrouter-transcription';

jest.mock('@luanpoppe/ai', () => ({
  AI: jest.fn().mockImplementation(() => ({
    call: jest.fn(),
  })),
}));

jest.mock('@langchain/openai', () => ({
  OpenAIEmbeddings: jest.fn().mockImplementation(() => ({
    embedDocuments: jest.fn().mockResolvedValue([[0.1, 0.2]]),
    embedQuery: jest.fn().mockResolvedValue([0.1, 0.2]),
  })),
}));

jest.mock('./openrouter-transcription', () => ({
  ...jest.requireActual<typeof openrouterTranscription>(
    './openrouter-transcription',
  ),
  transcribeViaOpenRouter: jest.fn(),
}));

const mockEnvs = {
  DATABASE_URL: 'postgresql://choque:choque@localhost:6017/choque_rag',
  PORT: 3000,
  OPENROUTER_API_KEY: 'test-openrouter-key',
  EMBEDDING_MODEL: 'openai/text-embedding-3-small',
  WHISPER_MODEL: 'openai/whisper-large-v3',
};

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

  it('should construct AI client with OpenRouter key from EnvService', () => {
    expect(AI).toHaveBeenCalledWith({
      openRouterApiKey: mockEnvs.OPENROUTER_API_KEY,
      googleGeminiToken: undefined,
    });
  });

  it('should configure OpenAIEmbeddings for OpenRouter', () => {
    expect(OpenAIEmbeddings).toHaveBeenCalledWith(
      expect.objectContaining({
        apiKey: mockEnvs.OPENROUTER_API_KEY,
        model: mockEnvs.EMBEDDING_MODEL,
        configuration: { baseURL: 'https://openrouter.ai/api/v1' },
      }),
    );
  });

  it('should embed documents (smoke)', async () => {
    const vectors = await service.embedDocuments(['trecho do episódio']);
    expect(vectors).toEqual([[0.1, 0.2]]);
  });

  it('should transcribe via OpenRouter', async () => {
    jest
      .mocked(openrouterTranscription.transcribeViaOpenRouter)
      .mockResolvedValue('transcrição');
    const audio = Buffer.from('fake-audio');
    const result = await service.transcribeWithWhisper(audio, {
      model: 'whisper-1',
      languageIn2Digits: 'pt',
    });
    expect(result).toBe('transcrição');
    expect(
      openrouterTranscription.transcribeViaOpenRouter,
    ).toHaveBeenCalledWith({
      apiKey: mockEnvs.OPENROUTER_API_KEY,
      model: 'openai/whisper-1',
      audioBase64: audio.toString('base64'),
      format: 'mp3',
      language: 'pt',
      temperature: undefined,
    });
  });
});
