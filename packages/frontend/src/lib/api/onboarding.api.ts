import { apiClient } from './client';

export type OnboardingSuggestionsResponse = {
  suggestions: string[];
  emptyCorpus: boolean;
  panorama?: string;
};

export async function fetchOnboardingSuggestions(): Promise<OnboardingSuggestionsResponse> {
  const { data } = await apiClient.post<OnboardingSuggestionsResponse>(
    '/api/onboarding/suggestions',
    {},
  );
  return data;
}
