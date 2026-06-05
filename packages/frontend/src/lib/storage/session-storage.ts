import type { ChatMessage } from '@/lib/api/chat.types';
import { STORAGE_KEYS } from './keys';

export function loadSessionMessages(): ChatMessage[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.session);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ChatMessage[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveSessionMessages(messages: ChatMessage[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(messages));
}

export function clearSessionMessages(): void {
  localStorage.removeItem(STORAGE_KEYS.session);
}
