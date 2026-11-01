import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, render, screen, fireEvent } from '@testing-library/react';
import { useTheme, THEME_STORAGE_KEY } from './useTheme';
import { useAppStore } from '@/store/useAppStore';
import ThemeToggle from '@/components/ThemeToggle';

vi.mock('@/db', () => ({
  get: vi.fn(() => Promise.resolve(null)),
  set: vi.fn(() => Promise.resolve()),
  del: vi.fn(() => Promise.resolve()),
}));

let listeners: Array<() => void> = [];
let prefersDark = true;

beforeEach(() => {
  listeners = [];
  prefersDark = true;
  document.documentElement.classList.remove('light');
  const mem: Record<string, string> = {};
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => (k in mem ? mem[k] : null),
    setItem: (k: string, v: string) => { mem[k] = v; },
    removeItem: (k: string) => { delete mem[k]; },
    clear: () => { Object.keys(mem).forEach((k) => delete mem[k]); },
  });
  Object.defineProperty(window, "matchMedia", { configurable: true, writable: true, value: vi.fn().mockImplementation((q: string) => ({
    get matches() { return q.includes('dark') ? prefersDark : !prefersDark; },
    media: q,
    addEventListener: (_: string, cb: () => void) => listeners.push(cb),
    removeEventListener: (_: string, cb: () => void) => { listeners = listeners.filter((l) => l !== cb); },
  })) });
  useAppStore.setState({ prefs: { ...useAppStore.getState().prefs, theme: 'dark' } });
});

describe('useTheme', () => {
  it('dark: sin clase .light', () => {
    renderHook(() => useTheme());
    expect(document.documentElement.classList.contains('light')).toBe(false);
  });

  it('light: aplica .light y persiste en el store', () => {
    const { result } = renderHook(() => useTheme());
    act(() => result.current.setTheme('light'));
    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(useAppStore.getState().prefs.theme).toBe('light');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
  });

  it('volver a dark remueve .light', () => {
    const { result } = renderHook(() => useTheme());
    act(() => result.current.setTheme('light'));
    act(() => result.current.setTheme('dark'));
    expect(document.documentElement.classList.contains('light')).toBe(false);
  });

  it('auto: sigue prefers-color-scheme y reacciona a cambios', () => {
    prefersDark = false;
    const { result } = renderHook(() => useTheme());
    act(() => result.current.setTheme('auto'));
    expect(document.documentElement.classList.contains('light')).toBe(true);
    prefersDark = true;
    act(() => listeners.forEach((l) => l()));
    expect(document.documentElement.classList.contains('light')).toBe(false);
  });

  it('auto: libera el listener al salir de auto', () => {
    const { result } = renderHook(() => useTheme());
    act(() => result.current.setTheme('auto'));
    expect(listeners.length).toBe(1);
    act(() => result.current.setTheme('dark'));
    expect(listeners.length).toBe(0);
  });

  it('valor inválido cae a dark', () => {
    useAppStore.setState({ prefs: { ...useAppStore.getState().prefs, theme: 'x' as never } });
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('dark');
  });
});

describe('ThemeToggle', () => {
  it('cambia el tema al pulsar', () => {
    render(<ThemeToggle />);
    fireEvent.click(screen.getByLabelText('Modo claro'));
    expect(useAppStore.getState().prefs.theme).toBe('light');
    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(screen.getByLabelText('Modo claro').getAttribute('aria-checked')).toBe('true');
  });
});
