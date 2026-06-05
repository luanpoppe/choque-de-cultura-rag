import { CitationCard } from '@/components/citation/CitationCard';
import type { ChatMessage } from '@/lib/api/chat.types';

type MessageBubbleProps = {
  message: ChatMessage;
};

export function MessageBubble({ message }: MessageBubbleProps) {
  if (message.role === 'user') {
    return (
      <div
        className="max-w-[88%] self-end rounded-[22px_22px_6px_22px] bg-[var(--choque-user-bubble)] px-[18px] py-3 text-[15px] leading-relaxed text-[var(--choque-user-bubble-text)]"
        role="article"
        aria-label="Sua pergunta"
      >
        {message.content}
      </div>
    );
  }

  const showCitations =
    !message.noMatch &&
    !message.offTopic &&
    message.citations &&
    message.citations.length > 0;

  return (
    <div className="max-w-full self-start" role="article" aria-label="Resposta do agente">
      <div className="rounded-[22px_22px_22px_6px] border border-[var(--choque-agent-bubble-border)] bg-[var(--choque-agent-bubble)] px-[18px] py-3.5 text-[15px] leading-relaxed text-[var(--choque-agent-bubble-text)]">
        {message.content}
      </div>
      {showCitations ? (
        <div className="mt-3 flex flex-col gap-3" aria-label="Citações">
          {message.citations!.map((citation, index) => (
            <CitationCard
              key={`${citation.youtubeVideoId}-${citation.startSec}-${index}`}
              citation={citation}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
