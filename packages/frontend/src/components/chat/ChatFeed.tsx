'use client';

import { useEffect, useRef } from 'react';
import type { ChatMessage } from '@/lib/api/chat.types';
import { MessageBubble } from './MessageBubble';

type ChatFeedProps = {
  messages: ChatMessage[];
  isLoading: boolean;
};

export function ChatFeed({ messages, isLoading }: ChatFeedProps) {
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = feedRef.current;
    if (!element) return;
    element.scrollTop = element.scrollHeight;
  }, [messages, isLoading]);
  if (messages.length === 0 && !isLoading) {
    return null;
  }

  return (
    <div
      ref={feedRef}
      className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-2"
      role="log"
      aria-live="polite"
      aria-relevant="additions"
      aria-label="Histórico da conversa"
    >
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      {isLoading ? (
        <p className="self-start text-sm text-choque-secondary" role="status">
          Pensando…
        </p>
      ) : null}
    </div>
  );
}
