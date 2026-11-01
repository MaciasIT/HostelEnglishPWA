/**
 * Servicio háptico centralizado (FB-06).
 *
 * Emula la jerarquía sensorial de un Taptic Engine nativo mediante patrones
 * de la Vibration API. Cada evento semántico tiene un patrón fijo.
 *
 * - Respeta la preferencia `prefs.hapticsEnabled` (ausente = activado).
 * - Fallback transparente a no-op si el dispositivo/navegador no soporta
 *   `navigator.vibrate` (escritorio, Safari iOS, entornos SSR/tests sin API).
 *
 * Uso: `haptics.trigger('SUCCESS')`
 */
import { useAppStore } from '@/store/useAppStore';

/** Patrones de vibración en milisegundos (alternan vibración / pausa). */
export const HAPTIC_PATTERNS = {
  /** Tap ligero y nítido: acierto en quiz/frases. */
  SUCCESS: [15],
  /** Aviso suave o intento fallido menor (no pierde vida). */
  WARNING: [10, 30, 10],
  /** Fallo crítico o pérdida de vida ❤️. */
  ERROR: [40, 20, 40],
  /** Racha o subida de nivel 🔥. */
  STREAK: [20, 20, 20, 20, 40],
  /** Cambio de tab o selección en menú. */
  SELECTION: [8],
} as const satisfies Record<string, readonly number[]>;

export type HapticType = keyof typeof HAPTIC_PATTERNS;

/** Comprueba si el dispositivo expone la Vibration API. */
const isVibrationSupported = (): boolean => {
  try {
    return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
  } catch {
    return false;
  }
};

/** Lee la preferencia del usuario. Por defecto, activado. */
const isUserEnabled = (): boolean => {
  try {
    return useAppStore.getState().prefs.hapticsEnabled !== false;
  } catch {
    return true;
  }
};

export const haptics = {
  /**
   * Dispara el patrón háptico asociado al tipo de evento.
   * Devuelve `true` si se solicitó la vibración al dispositivo.
   */
  trigger(type: HapticType): boolean {
    if (!isUserEnabled()) return false;
    if (!isVibrationSupported()) return false;
    const pattern = HAPTIC_PATTERNS[type];
    if (!pattern) return false;
    try {
      return navigator.vibrate([...pattern]);
    } catch {
      return false;
    }
  },
};

export default haptics;
