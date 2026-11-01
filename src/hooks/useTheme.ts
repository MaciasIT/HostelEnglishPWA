import { useCallback, useEffect, useLayoutEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import type { ThemePreference } from '@/store/types';

export const THEME_STORAGE_KEY = 'he-theme';
const DARK_QUERY = '(prefers-color-scheme: dark)';

export type ResolvedTheme = 'dark' | 'light';

export const normalizeTheme = (value: unknown): ThemePreference =>
  value === 'light' || value === 'auto' || value === 'dark' ? value : 'dark';

const systemPrefersDark = (): boolean =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(DARK_QUERY).matches
    : true;

export const resolveTheme = (theme: ThemePreference): ResolvedTheme =>
  theme === 'auto' ? (systemPrefersDark() ? 'dark' : 'light') : theme;

/** Aplica/remueve `.light` en <html> y refleja la preferencia en localStorage (anti-FOUC). */
export const applyTheme = (theme: ThemePreference): ResolvedTheme => {
  const resolved = resolveTheme(theme);
  const root = document.documentElement;
  root.classList.toggle('light', resolved === 'light');
  root.style.colorScheme = resolved;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* almacenamiento no disponible */
  }
  return resolved;
};

const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export function useTheme() {
  const theme = normalizeTheme(useAppStore((s) => s.prefs.theme));
  const setStoreTheme = useAppStore((s) => s.setTheme);

  useIsoLayoutEffect(() => {
    applyTheme(theme);
    if (theme !== 'auto' || typeof window.matchMedia !== 'function') return;
    const mql = window.matchMedia(DARK_QUERY);
    const onChange = () => applyTheme('auto');
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [theme]);

  const setTheme = useCallback((t: ThemePreference): void => { setStoreTheme(t); }, [setStoreTheme]);

  return { theme, resolvedTheme: resolveTheme(theme), setTheme };
}
