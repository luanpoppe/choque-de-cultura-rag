jest.mock('@infrastructure/ai/ai.service', () => ({
  AiService: class AiService {},
}));
jest.mock('@core/env.service', () => ({
  EnvService: class EnvService {
    getEnvs() {
      return { CHAT_MODEL: 'openrouter/deepseek/deepseek-v4-flash' };
    }
  },
}));
jest.mock('./onboarding-suggestion.ai', () => ({
  generateOnboardingSuggestionsWithAi: jest.fn(),
}));
jest.mock('./onboarding-suggestion.fallback', () => ({
  buildFallbackSuggestions: jest.fn(),
}));

import { OnboardingService } from './onboarding.service';
import { PrismaService } from '@infrastructure/prisma/prisma.service';
import { generateOnboardingSuggestionsWithAi } from './onboarding-suggestion.ai';
import { buildFallbackSuggestions } from './onboarding-suggestion.fallback';

const generateWithAi = generateOnboardingSuggestionsWithAi as jest.Mock;
const buildFallback = buildFallbackSuggestions as jest.Mock;

describe('OnboardingService', () => {
  const prisma = {
    chunk: { count: jest.fn() },
    episode: { findMany: jest.fn() },
    $queryRaw: jest.fn(),
  };

  const service = new OnboardingService(
    prisma as unknown as PrismaService,
    {} as never,
    { getEnvs: () => ({ CHAT_MODEL: 'openrouter/deepseek/deepseek-v4-flash' }) } as never,
  );

  const sampleRow = {
    text: 'Harry Potter sem Harry Potter no cinema',
    title: 'CHOQUE DE CULTURA #1: Harry Potter Sem Harry Potter',
  };

  beforeEach(() => jest.clearAllMocks());

  it('retorna emptyCorpus quando não há chunks', async () => {
    prisma.chunk.count.mockResolvedValue(0);
    const result = await service.getSuggestions();
    expect(result.emptyCorpus).toBe(true);
    expect(result.suggestions).toEqual([]);
    expect(generateWithAi).not.toHaveBeenCalled();
  });

  it('usa IA para sugestões quando disponível', async () => {
    prisma.chunk.count.mockResolvedValue(3);
    prisma.$queryRaw.mockResolvedValue([sampleRow]);
    prisma.episode.findMany.mockResolvedValue([{ title: sampleRow.title }]);
    generateWithAi.mockResolvedValue([
      'O que acharam do Harry Potter sem protagonista?',
      'Tem piada sobre adaptação de livro?',
    ]);
    buildFallback.mockReturnValue([]);

    const result = await service.getSuggestions(2);
    expect(result.emptyCorpus).toBe(false);
    expect(generateWithAi).toHaveBeenCalled();
    expect(result.suggestions).toHaveLength(2);
    expect(buildFallback).not.toHaveBeenCalled();
  });

  it('cai no fallback heurístico quando IA falha', async () => {
    prisma.chunk.count.mockResolvedValue(3);
    prisma.$queryRaw.mockResolvedValue([sampleRow]);
    prisma.episode.findMany.mockResolvedValue([{ title: sampleRow.title }]);
    generateWithAi.mockResolvedValue(null);
    buildFallback.mockReturnValue(['O que falaram de Harry Potter?']);

    const result = await service.getSuggestions(1);
    expect(result.suggestions).toEqual(['O que falaram de Harry Potter?']);
    expect(buildFallback).toHaveBeenCalled();
  });
});
