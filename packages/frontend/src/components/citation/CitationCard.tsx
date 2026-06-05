import type { ChatCitation } from '@/lib/api/chat.types';
import { buildWatchUrl, formatTimestamp } from '@/lib/youtube';

type CitationCardProps = {
  citation: ChatCitation;
};

export function CitationCard({ citation }: CitationCardProps) {
  const watchUrl =
    citation.watchUrl ||
    buildWatchUrl(citation.youtubeVideoId, citation.startSec);

  return (
    <article className="flex gap-3.5 rounded-[20px] border border-choque-accent-surface-strong bg-[var(--choque-card-bg)] p-3.5 shadow-[0_2px_8px_rgba(225,29,72,0.06)]">
      <div
        className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--choque-thumb-start)] to-[var(--choque-thumb-end)] text-[22px]"
        aria-hidden
      >
        🎬
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="mb-1 text-[13px] font-semibold leading-snug tracking-tight text-choque-primary">
          {citation.episodeTitle}
        </h3>
        <p className="mb-1.5 text-xs font-semibold text-choque-accent">
          {formatTimestamp(citation.startSec, citation.durationSec)}
        </p>
        <p className="mb-2.5 line-clamp-3 text-[13px] leading-snug text-choque-secondary">
          “{citation.quote}”
        </p>
        <a
          href={watchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full bg-choque-accent px-3.5 py-2 text-xs font-semibold text-white hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-choque-accent"
        >
          Abrir no YouTube
        </a>
      </div>
    </article>
  );
}
