import { buildNaturalSuggestion } from './onboarding-suggestion.builder';
import type { CorpusSample } from './onboarding-suggestion.ai';

export function buildFallbackSuggestions(
  samples: CorpusSample[],
  limit: number,
): string[] {
  const seen = new Set<string>();
  const suggestions: string[] = [];

  for (const sample of samples) {
    if (suggestions.length >= limit) break;
    const suggestion = buildNaturalSuggestion(
      sample.text,
      sample.title,
      suggestions.length,
    );
    const key = suggestion.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    suggestions.push(suggestion);
  }

  return suggestions;
}
