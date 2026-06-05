'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { fetchOnboardingSuggestions } from '@/lib/api/onboarding.api';
import { postChat } from '@/lib/api/chat.api';
import type { ChatHistoryItem, ChatMessage } from '@/lib/api/chat.types';
import { resolveChatError } from '@/lib/chat-errors';
import {
  clearSessionMessages,
  loadSessionMessages,
  saveSessionMessages,
} from '@/lib/storage/session-storage';
import { OnboardingPanorama } from '@/components/onboarding/OnboardingPanorama';
import { SuggestionChips } from '@/components/onboarding/SuggestionChips';
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

export function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [onboardingLoading, setOnboardingLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [panorama, setPanorama] = useState<string | undefined>();
  const lastFailedTextRef = useRef<string | null>(null);

  useEffect(() => {
    setMessages(loadSessionMessages());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveSessionMessages(messages);
  }, [messages, hydrated]);

  const hasMessages = messages.length > 0;
  const showOnboardingPanel = suggestions.length > 0 && !hasMessages;
  const showHero = !hasMessages && !showOnboardingPanel && !isLoading;
  const canResetSession =
    hasMessages || suggestions.length > 0 || Boolean(panorama);

  const handleNewConversation = useCallback(() => {
    clearSessionMessages();
    setMessages([]);
    setInput('');
    setSuggestions([]);
    setPanorama(undefined);
    setIsLoading(false);
    lastFailedTextRef.current = null;
  }, []);

  const sendMessage = useCallback(
    async (overrideText?: string) => {
      const text = (overrideText ?? input).trim();
      if (!text) {
        toast.error('Escreva uma pergunta sobre Choque de Cultura.');
        return;
      }
      if (isLoading) return;

      const history = toApiHistory(messages);
      setInput('');
      setSuggestions([]);
      setPanorama(undefined);
      setIsLoading(true);
      lastFailedTextRef.current = null;

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
        const message = resolveChatError(error);
        lastFailedTextRef.current = text;
        toast.error(
          (t) => (
            <span className="flex flex-col gap-2">
              <span>{message}</span>
              <button
                type="button"
                className="self-start text-sm font-semibold underline"
                onClick={() => {
                  toast.dismiss(t.id);
                  void sendMessage(text);
                }}
              >
                Tentar de novo
              </button>
            </span>
          ),
          { duration: 8000 },
        );
        setMessages((prev) =>
          prev.filter((item) => item.id !== userMessage.id),
        );
        setInput(text);
      } finally {
        setIsLoading(false);
      }
    },
    [input, isLoading, messages],
  );

  const handleOnboarding = useCallback(async () => {
    setOnboardingLoading(true);
    try {
      const result = await fetchOnboardingSuggestions();
      if (result.emptyCorpus) {
        toast(
          'O acervo ainda está sendo indexado. Volte em breve ou pergunte algo depois da ingestão.',
          { icon: 'ℹ️', duration: 6000 },
        );
        setSuggestions([]);
        setPanorama(undefined);
        return;
      }
      setSuggestions(result.suggestions);
      setPanorama(result.panorama);
    } catch {
      toast.error('Não foi possível carregar sugestões. Tente de novo.');
    } finally {
      setOnboardingLoading(false);
    }
  }, []);

  if (!hydrated) {
    return null;
  }

  return (
    <ChatShell
      showNewConversation={canResetSession}
      onNewConversation={handleNewConversation}
      newConversationDisabled={isLoading || onboardingLoading}
    >
      {showHero ? (
        <ChatHeroEmpty
          onStartOnboarding={handleOnboarding}
          onboardingLoading={onboardingLoading}
        />
      ) : null}
      {showOnboardingPanel && panorama ? (
        <OnboardingPanorama text={panorama} />
      ) : null}
      {showOnboardingPanel ? (
        <SuggestionChips
          suggestions={suggestions}
          onSelect={(suggestion) => void sendMessage(suggestion)}
        />
      ) : null}
      <ChatFeed messages={messages} isLoading={isLoading} />
      <ChatComposer
        value={input}
        onChange={setInput}
        onSubmit={() => void sendMessage()}
        disabled={isLoading}
      />
    </ChatShell>
  );
}
