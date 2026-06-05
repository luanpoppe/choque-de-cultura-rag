import { STORAGE_KEYS } from './keys';

export type ThemeMode = 'light' | 'dark';

export function getSystemTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

export function loadStoredTheme(): ThemeMode | null {
  if (typeof window === 'undefined') return null;
  const value = localStorage.getItem(STORAGE_KEYS.theme);
  return value === 'dark' || value === 'light' ? value : null;
}

export function saveTheme(theme: ThemeMode): void {
  localStorage.setItem(STORAGE_KEYS.theme, theme);
}

export function applyThemeToDocument(theme: ThemeMode): void {
  document.documentElement.dataset.theme = theme;
}
