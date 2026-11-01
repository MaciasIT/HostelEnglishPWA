import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockUseAppStore, mockBaseState } = vi.hoisted(() => {
  const baseState: any = {
    frasesLoaded: false,
    conversationsLoaded: false,
    initializeCategories: vi.fn(),
    loadFrases: vi.fn(),
    loadConversations: vi.fn(),
    prefs: { targetLanguage: 'en' },
  };

  const persist: any = {
    onFinishHydration: vi.fn(() => vi.fn()),
    hasHydrated: vi.fn(() => false),
    clearStorage: vi.fn(() => Promise.resolve()),
  };

  const useAppStore = vi.fn((selector?: (state: any) => any) => {
    if (typeof selector === 'function') return selector(baseState);
    return baseState;
  });
  (useAppStore as any).persist = persist;

  return { mockUseAppStore: useAppStore, mockBaseState: baseState };
});

vi.mock('@/pushNotifications', () => ({
  initNotifications: vi.fn(),
}));

vi.mock('@/monitoring/sentry', () => ({
  initSentry: vi.fn(),
}));

vi.mock('@/services/syncService', () => ({
  initSync: vi.fn(),
}));

vi.mock('./InstallPWAButton', () => ({
  __esModule: true,
  default: () => <div data-testid="install-pwa">Install</div>,
}));

vi.mock('@/store/useAppStore', () => ({
  useAppStore: mockUseAppStore,
}));

import { render, screen, act } from '@testing-library/react';
import AppInitializer from './AppInitializer';

describe('<AppInitializer />', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    document.getElementById('splash')?.remove();

    // Resetear estado base
    mockBaseState.frasesLoaded = false;
    mockBaseState.conversationsLoaded = false;
    mockBaseState.loadFrases = vi.fn();
    mockBaseState.loadConversations = vi.fn();
    mockBaseState.initializeCategories = vi.fn();

    // Resetear persist mocks
    const persist = (mockUseAppStore as any).persist;
    persist.hasHydrated.mockReturnValue(false);
    persist.onFinishHydration.mockReturnValue(() => vi.fn());
  });

  it('debería renderizar los hijos aunque no haya hidratado', () => {
    render(
      <AppInitializer>
        <div data-testid="app-shell">App Shell</div>
      </AppInitializer>
    );

    expect(screen.getByTestId('app-shell')).toBeInTheDocument();
  });

  it('debería marcar como hidratado cuando el store ya está hidratado', () => {
    (mockUseAppStore as any).persist.hasHydrated.mockReturnValue(true);

    render(
      <AppInitializer>
        <div data-testid="app-shell">App Shell</div>
      </AppInitializer>
    );

    expect(screen.queryByText('Sincronizando')).not.toBeInTheDocument();
    expect(screen.getByTestId('install-pwa')).toBeInTheDocument();
  });

  it('debería hidratar automáticamente tras el timeout si el store no responde', async () => {
    render(
      <AppInitializer>
        <div data-testid="app-shell">App Shell</div>
      </AppInitializer>
    );

    expect(screen.getByTestId('app-shell')).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(4000);
    });

    expect(screen.getByTestId('app-shell')).toBeInTheDocument();
  });

  it('debería cargar frases y conversaciones tras hidratar', () => {
    (mockUseAppStore as any).persist.hasHydrated.mockReturnValue(true);
    mockBaseState.frasesLoaded = false;
    mockBaseState.conversationsLoaded = false;

    render(
      <AppInitializer>
        <div data-testid="app-shell">App Shell</div>
      </AppInitializer>
    );

    expect(mockBaseState.loadFrases).toHaveBeenCalled();
    expect(mockBaseState.loadConversations).toHaveBeenCalled();
  });
});
