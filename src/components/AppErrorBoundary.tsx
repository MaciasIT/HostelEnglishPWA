import { Component, ReactNode } from 'react';

/** Limpia Service Workers y cachés (no toca IndexedDB/localStorage) y recarga. */
export const clearCachesAndReload = async (): Promise<void> => {
  try {
    const regs = (await navigator.serviceWorker?.getRegistrations?.()) ?? [];
    await Promise.all(
      regs.map((r) => {
        // Activa de inmediato un SW en espera (skipWaiting) antes de purgarlo.
        try { r.waiting?.postMessage({ type: 'SKIP_WAITING' }); } catch { /* ignorar */ }
        return r.unregister();
      }),
    );
    if (typeof caches !== 'undefined') {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch (err) {
    console.warn('[recovery] Limpieza parcial:', err);
  } finally {
    location.replace(`${location.pathname}?r=${Date.now()}${location.hash}`);
  }
};

interface State {
  hasError: boolean;
  detail: string;
}

declare global {
  interface Window {
    __heDiag?: { log: (label: string, e: unknown) => void };
  }
}

const describeError = (error: unknown): string =>
  error instanceof Error ? `${error.name}: ${error.message}\n${error.stack ?? ''}` : String(error);

/** Evita la pantalla en negro ante un crash de render: ofrece recuperación. */
export default class AppErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false, detail: '' };

  static getDerivedStateFromError(error: unknown): State {
    return { hasError: true, detail: describeError(error) };
  }

  componentDidCatch(error: unknown): void {
    console.error('[AppErrorBoundary]', error);
    try {
      window.__heDiag?.log('react-render', error);
    } catch {
      /* el log nunca debe romper la recuperación */
    }
    document.getElementById('splash')?.remove();
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div role="alert" className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center bg-surface text-primary">
        <h1 className="text-xl font-bold">Algo salió mal al arrancar HostelEnglish</h1>
        <div className="flex flex-wrap gap-3 justify-center">
          <button
            type="button"
            onClick={() => location.reload()}
            className="rounded-xl bg-amber-500 px-5 py-3 font-bold text-slate-900 min-h-[44px]"
          >
            Reintentar
          </button>
          <button
            type="button"
            onClick={() => void clearCachesAndReload()}
            className="rounded-xl border-2 border-amber-500 px-5 py-3 font-bold text-amber-500 min-h-[44px]"
          >
            Limpiar y reiniciar
          </button>
        </div>
        <details className="w-full max-w-md text-left text-xs">
          <summary className="cursor-pointer py-2 text-center min-h-[44px]">Ver diagnóstico</summary>
          <pre data-testid="error-detail" className="whitespace-pre-wrap break-words max-h-[40vh] overflow-auto rounded-lg bg-black/30 p-3">
            {this.state.detail}
          </pre>
        </details>
      </div>
    );
  }
}
