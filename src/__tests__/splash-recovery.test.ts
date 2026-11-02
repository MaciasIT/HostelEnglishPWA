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
    expect(box().textContent).toContain('limpiar caché y recargar');
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
