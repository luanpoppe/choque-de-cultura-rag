'use client';

type NewConversationButtonProps = {
  onClick: () => void;
  disabled?: boolean;
};

export function NewConversationButton({
  onClick,
  disabled = false,
}: NewConversationButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="choque-focus-ring rounded-full border border-choque-accent-border bg-choque-accent-surface px-3 py-1.5 text-xs font-semibold text-choque-accent-muted transition hover:bg-choque-accent-surface-strong disabled:cursor-not-allowed disabled:opacity-50"
      aria-label="Nova conversa — limpar mensagens e recomeçar"
    >
      Nova conversa
    </button>
  );
}
