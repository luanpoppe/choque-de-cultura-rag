'use client';

import { useTheme } from '@/components/theme/ThemeProvider';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="choque-focus-ring flex h-10 w-10 items-center justify-center rounded-full bg-choque-accent-surface text-base text-choque-accent-muted"
      title={theme === 'light' ? 'Ativar tema escuro' : 'Ativar tema claro'}
      aria-label={
        theme === 'light' ? 'Ativar tema escuro' : 'Ativar tema claro'
      }
    >
      <span aria-hidden>{theme === 'light' ? '🌙' : '☀️'}</span>
    </button>
  );
}
