// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const html = readFileSync(path.resolve(__dirname, '../../index.html'), 'utf8');
const body = /<body>([\s\S]*)<\/body>/.exec(html)![1];
const splashScript = /<script id="splash-recovery-script">([\s\S]*?)<\/script>/.exec(html)![1];

const runInline = () => {
  // eslint-disable-next-line no-new-func
  new Function(splashScript)();
};

describe('index.html – recuperación del splash (BUG-01)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = body.replace(/<script[\s\S]*?<\/script>/g, '');
  });
  afterEach(() => vi.useRealTimers());

  const box = () => document.getElementById('splash-recovery')!;

  it('el botón de recuperación está oculto al inicio y aparece a los 3 s', () => {
    runInline();
    expect(box().classList.contains('visible')).toBe(false);
    vi.advanceTimersByTime(3000);
    expect(box().classList.contains('visible')).toBe(true);
    expect(box().textContent).toContain('Limpiar y reiniciar');
    expect(box().textContent).toContain('Reintentar');
    expect(document.getElementById('splash-spinner')!.style.display).toBe('none');
  });

  it('BUG-03: window.onerror vuelca mensaje y traza en el diagnóstico visible', () => {
    runInline();
    window.dispatchEvent(new ErrorEvent('error', { message: 'boom', filename: 'main.js', lineno: 3, colno: 7, error: new Error('boom') }));
    const log = document.getElementById('he-diag-log')!.textContent!;
    expect(box().classList.contains('visible')).toBe(true);
    expect(log).toContain('boom');
    expect(log).toContain('main.js:3:7');
    expect((document.getElementById('he-diag') as HTMLDetailsElement).open).toBe(true);
  });

  it('BUG-03: unhandledrejection se registra en el diagnóstico', () => {
    runInline();
    const ev = new Event('unhandledrejection') as any;
    ev.reason = new Error('promesa rota');
    window.dispatchEvent(ev);
    expect(document.getElementById('he-diag-log')!.textContent).toContain('promesa rota');
  });

  it('BUG-03: tras 3 s sin montar muestra mensaje de arranque fallido (nunca negro mudo)', () => {
    runInline();
    vi.advanceTimersByTime(3000);
    expect(document.getElementById('splash-recovery-msg')!.textContent).toContain('no ha arrancado');
    expect(document.getElementById('he-diag-log')!.textContent).toContain('React no montó');
  });

  it('BUG-03: error tras montar muestra botón flotante de diagnóstico', () => {
    runInline();
    document.getElementById('splash')!.remove();
    window.dispatchEvent(new ErrorEvent('error', { message: 'tarde', error: new Error('tarde') }));
    const fab = document.getElementById('he-fab')!;
    expect(fab.style.display).toBe('block');
    fab.click();
    expect(document.getElementById('he-panel')!.style.display).toBe('block');
    expect(document.getElementById('he-panel')!.textContent).toContain('tarde');
  });

  it('BUG-03: limpiar y reiniciar activa el SW en espera (skipWaiting)', async () => {
    const postMessage = vi.fn();
    const unregister = vi.fn().mockResolvedValue(true);
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: { getRegistrations: () => Promise.resolve([{ unregister, waiting: { postMessage } }]) },
    });
    (window as any).caches = { keys: () => Promise.resolve([]), delete: vi.fn() };
    runInline();
    document.getElementById('splash-recovery-btn')!.click();
    await vi.advanceTimersByTimeAsync(10);
    expect(postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
    expect(unregister).toHaveBeenCalled();
  });

  it('no aparece si la app ya retiró el splash', () => {
    runInline();
    const b = box();
    document.getElementById('splash')!.remove();
    vi.advanceTimersByTime(5000);
    expect(b.classList.contains('visible')).toBe(false);
  });

  it('aparece de inmediato ante un fallo de chunk (vite:preloadError)', () => {
    runInline();
    window.dispatchEvent(new Event('vite:preloadError'));
    expect(box().classList.contains('visible')).toBe(true);
  });

  it('al pulsar desregistra SWs y borra cachés', async () => {
    const unregister = vi.fn().mockResolvedValue(true);
    const del = vi.fn().mockResolvedValue(true);
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: { getRegistrations: () => Promise.resolve([{ unregister }]) },
    });
    (window as any).caches = { keys: () => Promise.resolve(['a', 'b']), delete: del };
    runInline();
    document.getElementById('splash-recovery-btn')!.click();
    await vi.advanceTimersByTimeAsync(10);
    expect(unregister).toHaveBeenCalledTimes(1);
    expect(del).toHaveBeenCalledTimes(2);
  });
});
