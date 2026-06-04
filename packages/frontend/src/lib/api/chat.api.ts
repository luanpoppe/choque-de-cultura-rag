import { apiClient } from './client';
import type { ChatApiRequest, ChatApiResponse } from './chat.types';

export async function postChat(body: ChatApiRequest): Promise<ChatApiResponse> {
  const { data } = await apiClient.post<ChatApiResponse>('/api/chat', body);
  return data;
}
