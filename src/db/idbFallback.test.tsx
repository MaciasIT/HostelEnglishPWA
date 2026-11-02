import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { get, set, del, __resetIdbFallback, isIdbUnavailable } from '@/db';
import { readPersistedState } from '@/store/persistStorage';
import AppErrorBoundary from '@/components/AppErrorBoundary';

describe('BUG-03: IndexedDB restringida (incógnito/WebView)', () => {
  beforeEach(() => {
    __resetIdbFallback();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    __resetIdbFallback();
  });

  it('indexedDB.open lanza SecurityError → fallback en memoria, sin lanzar', async () => {
    vi.stubGlobal('indexedDB', {
      open: () => {
        throw new DOMException('denied', 'SecurityError');
      },
    });
    await set('k', { a: 1 });
    expect(isIdbUnavailable()).toBe(true);
    expect(await get('k')).toEqual({ a: 1 });
    await del('k');
    expect(await get('k')).toBeUndefined();
  });

  it('indexedDB colgada (onsuccess nunca llega) → fallback tras el timeout', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('indexedDB', { open: () => ({}) });
    const p = readPersistedState('x');
    await vi.advanceTimersByTimeAsync(2500);
    await expect(p).resolves.toBeNull();
    expect(isIdbUnavailable()).toBe(true);
    // Siguientes operaciones son instantáneas (sin esperar timeouts)
    await set('y', 1);
    expect(await get('y')).toBe(1);
    vi.useRealTimers();
  });

  it('readPersistedState con IndexedDB bloqueada devuelve estado por defecto (null) al instante', async () => {
    vi.stubGlobal('indexedDB', {
      open: () => {
        throw new DOMException('denied', 'SecurityError');
      },
    });
    await expect(readPersistedState('hostelenglish-storage')).resolves.toBeNull();
  });
});

describe('BUG-03: AppErrorBoundary ante crash de render', () => {
  it('muestra recuperación, diagnóstico y registra en __heDiag; nunca pantalla vacía', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const log = vi.fn();
    (window as any).__heDiag = { log };
    const Boom = () => {
      throw new Error('fallo de hidratación simulado');
    };
    render(
      <AppErrorBoundary>
        <Boom />
      </AppErrorBoundary>,
    );
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.getByText('Reintentar')).toBeTruthy();
    expect(screen.getByText('Limpiar y reiniciar')).toBeTruthy();
    expect(screen.getByTestId('error-detail').textContent).toContain('fallo de hidratación simulado');
    expect(log).toHaveBeenCalledWith('react-render', expect.any(Error));
    delete (window as any).__heDiag;
  });
});
