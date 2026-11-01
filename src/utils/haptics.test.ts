import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Estado mutable del store simulado para controlar prefs.hapticsEnabled.
const mockPrefs: { hapticsEnabled?: boolean } = {};
vi.mock('@/store/useAppStore', () => ({
  useAppStore: {
    getState: () => ({ prefs: mockPrefs }),
  },
}));

import { haptics, HAPTIC_PATTERNS } from './haptics';

const vibrateMock = vi.fn((_pattern: number[]) => true);

const setVibrate = (value: unknown) => {
  Object.defineProperty(navigator, 'vibrate', {
    value,
    configurable: true,
    writable: true,
  });
};

const removeVibrate = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (navigator as any).vibrate;
};

describe('haptics: patrones semánticos', () => {
  it('define los patrones exactos del mapa de eventos FB-06', () => {
    expect(HAPTIC_PATTERNS.SUCCESS).toEqual([15]);
    expect(HAPTIC_PATTERNS.WARNING).toEqual([10, 30, 10]);
    expect(HAPTIC_PATTERNS.ERROR).toEqual([40, 20, 40]);
    expect(HAPTIC_PATTERNS.STREAK).toEqual([20, 20, 20, 20, 40]);
    expect(HAPTIC_PATTERNS.SELECTION).toEqual([8]);
  });
});

describe('haptics.trigger', () => {
  beforeEach(() => {
    vibrateMock.mockClear();
    setVibrate(vibrateMock);
    delete mockPrefs.hapticsEnabled; // por defecto: activado
  });

  afterEach(() => {
    removeVibrate();
  });

  it.each([
    ['SUCCESS', [15]],
    ['WARNING', [10, 30, 10]],
    ['ERROR', [40, 20, 40]],
    ['STREAK', [20, 20, 20, 20, 40]],
    ['SELECTION', [8]],
  ] as const)('dispara navigator.vibrate con el patrón de %s', (type, pattern) => {
    const ok = haptics.trigger(type);
    expect(ok).toBe(true);
    expect(vibrateMock).toHaveBeenCalledTimes(1);
    expect(vibrateMock).toHaveBeenCalledWith(pattern);
  });

  it('no vibra cuando el usuario desactiva hapticsEnabled', () => {
    mockPrefs.hapticsEnabled = false;
    expect(haptics.trigger('ERROR')).toBe(false);
    expect(vibrateMock).not.toHaveBeenCalled();
  });

  it('vibra cuando hapticsEnabled es true explícitamente', () => {
    mockPrefs.hapticsEnabled = true;
    haptics.trigger('SUCCESS');
    expect(vibrateMock).toHaveBeenCalledWith([15]);
  });

  it('es no-op transparente si navigator.vibrate no existe (escritorio)', () => {
    removeVibrate();
    expect(() => haptics.trigger('SUCCESS')).not.toThrow();
    expect(haptics.trigger('SUCCESS')).toBe(false);
  });

  it('es no-op si vibrate no es una función', () => {
    setVibrate('not-a-function');
    expect(() => haptics.trigger('WARNING')).not.toThrow();
    expect(haptics.trigger('WARNING')).toBe(false);
  });

  it('no propaga excepciones que lance la Vibration API', () => {
    setVibrate(() => {
      throw new Error('NotAllowedError');
    });
    expect(() => haptics.trigger('STREAK')).not.toThrow();
    expect(haptics.trigger('STREAK')).toBe(false);
  });

  it('pasa una copia del patrón (no expone la constante mutable)', () => {
    haptics.trigger('SELECTION');
    const arg = (vibrateMock.mock.calls as unknown as number[][][])[0][0];
    arg.push(999);
    expect(HAPTIC_PATTERNS.SELECTION).toEqual([8]);
  });
});
