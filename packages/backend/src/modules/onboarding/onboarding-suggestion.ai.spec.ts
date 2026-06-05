jest.mock('@luanpoppe/ai', () => ({
  AIMessages: {
    human: (content: string) => ({ role: 'human', content }),
  },
}));
jest.mock('@infrastructure/ai/ai.service', () => ({
  AiService: class AiService {},
}));
jest.mock('@infrastructure/ai/ai-json-call', () => ({
  callJsonOutput: jest.fn(),
}));

import { callJsonOutput } from '@infrastructure/ai/ai-json-call';
import {
  generateOnboardingSuggestionsWithAi,
  normalizeAiSuggestions,
} from './onboarding-suggestion.ai';

const callJson = callJsonOutput as jest.Mock;

describe('onboarding-suggestion.ai', () => {
  beforeEach(() => jest.clearAllMocks());

  it('normaliza e deduplica sugestões', () => {
    const result = normalizeAiSuggestions(
      [
        'O que falaram de Harry Potter',
        'O que falaram de Harry Potter?',
        '  Tem piada sobre Rambo?  ',
      ],
      5,
    );
    expect(result).toHaveLength(2);
    expect(result[0]).toMatch(/\?$/);
    expect(result.every((s) => s.length <= 68)).toBe(true);
  });

  it('retorna null quando a IA falha', async () => {
    callJson.mockResolvedValue(null);

    const result = await generateOnboardingSuggestionsWithAi(
      {} as never,
      'openrouter/deepseek/deepseek-v4-flash',
      [{ text: 'trecho', title: 'Ep 1' }],
      3,
    );
    expect(result).toBeNull();
  });

  it('retorna sugestões da IA quando ok', async () => {
    callJson.mockResolvedValue({
      suggestions: [
        'O que acharam do filme do Harry Potter?',
        'Tem piada sobre Rambo?',
      ],
    });

    const result = await generateOnboardingSuggestionsWithAi(
      {} as never,
      'openrouter/deepseek/deepseek-v4-flash',
      [{ text: 'Harry Potter e Rambo', title: 'Ep 1' }],
      2,
    );
    expect(result).toHaveLength(2);
    expect(result?.[0]).toContain('Harry Potter');
  });
});
