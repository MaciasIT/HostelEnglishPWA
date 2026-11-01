/**
 * Detección de capacidades del dispositivo y selección del motor de audio.
 *
 * La fuente se puede inyectar para que los tests sean deterministas sin
 * depender de qué expone el navegador/JSDOM.
 *
 * ⚠️ NOTA DE COORDINACIÓN (ver comentario de tarjeta t_cc2651bd):
 * el track LLM implementó `src/services/llm/webgpuDetection.ts` con una
 * detección de WebGPU/memoria equivalente. Este módulo es autocontenido a
 * propósito — no depende de código no commiteado de un sibling — pero ambas
 * utilidades deberían consolidarse en un único módulo compartido más adelante.
 */

import type { AudioEngineType, DeviceCapabilities } from './types';

/** RAM mínima (GB) para intentar Piper on-device. */
const PIPER_MIN_RAM_GB = 4;

const DEFAULT_CONCURRENCY = 2;

/** Fuente de la que se leen las capacidades del entorno (inyectable en tests). */
export interface CapabilitySource {
  navigator?: {
    gpu?: unknown;
    deviceMemory?: number;
    hardwareConcurrency?: number;
    onLine?: boolean;
  };
  window?: {
    AudioContext?: unknown;
    webkitAudioContext?: unknown;
    speechSynthesis?: unknown;
    isSecureContext?: boolean;
  };
}

/** Detección síncrona y pura de las capacidades del dispositivo. */
export function detectCapabilities(
  source: CapabilitySource = globalThis as unknown as CapabilitySource,
): DeviceCapabilities {
  const nav = source.navigator ?? {};
  const win = source.window ?? {};

  return {
    webgpu: typeof nav.gpu !== 'undefined',
    webAudio:
      typeof win.AudioContext !== 'undefined' ||
      typeof win.webkitAudioContext !== 'undefined',
    speechSynthesis: typeof win.speechSynthesis !== 'undefined',
    secureContext: win.isSecureContext === true,
    deviceMemoryGB: typeof nav.deviceMemory === 'number' ? nav.deviceMemory : null,
    hardwareConcurrency:
      typeof nav.hardwareConcurrency === 'number'
        ? nav.hardwareConcurrency
        : DEFAULT_CONCURRENCY,
    online: typeof nav.onLine === 'boolean' ? nav.onLine : true,
  };
}

/** Configuración del selector (fuera de las capacidades puras del hardware). */
export interface EnginePreferences {
  /** Cloud Workers AI / streaming está configurado (endpoint/API key presente). */
  cloudEnabled: boolean;
  /** Fuerza un motor concreto (diagnóstico / tests). `null` = seleccionar automáticamente. */
  forcedEngine?: AudioEngineType | null;
}

/**
 * Orden canónico de degradación. El selector elige el mejor motor; el gestor
 * intenta desde el seleccionado hacia abajo en esta lista.
 */
export const FALLBACK_ORDER: readonly AudioEngineType[] = ['piper', 'cloud', 'web-speech'];

/**
 * Selección pura por capacidades. Jerarquía: Piper on-device > Cloud > Web Speech.
 */
export function selectEngine(
  caps: DeviceCapabilities,
  prefs: EnginePreferences = { cloudEnabled: false },
): AudioEngineType {
  if (prefs.forcedEngine) return prefs.forcedEngine;

  // Sin una medida fiable asumimos que un dispositivo con WebGPU tiene RAM
  // suficiente; si la medida existe y es baja, degradamos.
  const hasEnoughMemory = caps.deviceMemoryGB === null || caps.deviceMemoryGB >= PIPER_MIN_RAM_GB;
  if (caps.webgpu && hasEnoughMemory) return 'piper';
  if (caps.online && prefs.cloudEnabled) return 'cloud';
  return 'web-speech';
}