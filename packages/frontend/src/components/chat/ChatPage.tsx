'use client';

import { useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { postChat } from '@/lib/api/chat.api';
import type { ChatHistoryItem, ChatMessage } from '@/lib/api/chat.types';
import { ChatComposer } from './ChatComposer';
import { ChatFeed } from './ChatFeed';
import { ChatHeroEmpty } from './ChatHeroEmpty';
import { ChatShell } from './ChatShell';

function newMessageId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

function toApiHistory(messages: ChatMessage[]): ChatHistoryItem[] {
  return messages.map((message) => ({
    role: message.role,
    content: message.content,
  }));
}

function resolveChatError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const body = error.response?.data as { message?: string } | undefined;
    if (status === 429) {
      return (
        body?.message ??
        'Muitas perguntas em pouco tempo. Aguarde um minuto e tente de novo.'
      );
    }
    if (status === 400 && body?.message) {
      return body.message;
    }
  }
  return 'Não foi possível obter resposta. Tente novamente em instantes.';
}

export function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const hasMessages = messages.length > 0;

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text) {
      toast.error('Escreva uma pergunta sobre Choque de Cultura.');
      return;
    }
    if (isLoading) return;

    const history = toApiHistory(messages);
    setInput('');
    setIsLoading(true);

    const userMessage: ChatMessage = {
      id: newMessageId(),
      role: 'user',
      content: text,
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const response = await postChat({
        message: text,
        history: history.length > 0 ? history : undefined,
      });

      const assistantMessage: ChatMessage = {
        id: newMessageId(),
        role: 'assistant',
        content: response.reply,
        noMatch: response.noMatch,
        offTopic: response.offTopic,
        citations: response.citations,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      toast.error(resolveChatError(error));
      setMessages((prev) => prev.filter((message) => message.id !== userMessage.id));
      setInput(text);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages]);

  return (
    <ChatShell>
      {!hasMessages && !isLoading ? <ChatHeroEmpty /> : null}
      <ChatFeed messages={messages} isLoading={isLoading} />
      <ChatComposer
        value={input}
        onChange={setInput}
        onSubmit={sendMessage}
        disabled={isLoading}
      />
    </ChatShell>
  );
}
