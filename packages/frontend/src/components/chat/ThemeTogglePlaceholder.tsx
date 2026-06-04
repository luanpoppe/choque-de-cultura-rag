'use client';

/** Placeholder para story 3.5 (tema claro/escuro). */
export function ThemeTogglePlaceholder() {
  return (
    <button
      type="button"
      className="flex h-10 w-10 items-center justify-center rounded-full bg-choque-accent-surface text-base text-choque-accent-muted"
      title="Alternar tema (em breve)"
      aria-label="Alternar tema claro ou escuro (em breve)"
      disabled
    >
      <span aria-hidden>🌙</span>
    </button>
  );
}
