import { z } from 'zod';
import { extractJsonFromModelText } from './ai-json-call';

describe('extractJsonFromModelText', () => {
  it('parseia JSON direto', () => {
    expect(extractJsonFromModelText('{"offTopic":true}')).toEqual({
      offTopic: true,
    });
  });

  it('parseia JSON em fence markdown', () => {
    const raw = '```json\n{"suggestions":["O que falaram de X?"]}\n```';
    const parsed = extractJsonFromModelText(raw);
    expect(z.object({ suggestions: z.array(z.string()) }).parse(parsed)).toBeDefined();
  });
});
