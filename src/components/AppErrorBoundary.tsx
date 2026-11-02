import { Component, ReactNode } from 'react';

/** Limpia Service Workers y cachés (no toca IndexedDB/localStorage) y recarga. */
export const clearCachesAndReload = async (): Promise<void> => {
  try {
    const regs = (await navigator.serviceWorker?.getRegistrations?.()) ?? [];
    await Promise.all(regs.map((r) => r.unregister()));
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
}

/** Evita la pantalla en negro ante un crash de render: ofrece recuperación. */
export default class AppErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown): void {
    console.error('[AppErrorBoundary]', error);
    document.getElementById('splash')?.remove();
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div role="alert" className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center bg-surface text-primary">
        <h1 className="text-xl font-bold">Algo salió mal al arrancar HostelEnglish</h1>
        <button
          type="button"
          onClick={() => void clearCachesAndReload()}
          className="rounded-xl bg-amber-500 px-5 py-3 font-bold text-slate-900 min-h-[44px]"
        >
          Limpiar caché y recargar
        </button>
      </div>
    );
  }
}
