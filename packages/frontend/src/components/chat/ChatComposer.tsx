'use client';

import type { FormEvent } from 'react';

type ChatComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled: boolean;
};

export function ChatComposer({
  value,
  onChange,
  onSubmit,
  disabled,
}: ChatComposerProps) {
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <form
      className="shrink-0 px-5 pb-6 pt-4"
      onSubmit={handleSubmit}
      aria-label="Enviar pergunta"
    >
      <div className="flex items-center gap-2 rounded-full border border-choque-accent-border bg-[var(--choque-surface-subtle)] py-1.5 pl-5 pr-1.5 focus-within:border-choque-accent-border-focus focus-within:shadow-[0_0_0_3px_var(--choque-accent-ring)]">
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          placeholder="Quando falaram de Dune?"
          className="min-w-0 flex-1 border-none bg-transparent text-[15px] text-choque-primary outline-none placeholder:text-choque-muted disabled:opacity-60"
          aria-label="Pergunta sobre o podcast"
        />
        <button
          type="submit"
          disabled={disabled}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-choque-accent text-lg text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Enviar pergunta"
        >
          ↑
        </button>
      </div>
    </form>
  );
}
