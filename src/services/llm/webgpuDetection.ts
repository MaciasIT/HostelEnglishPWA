/**
 * Detección de capacidades del dispositivo para decidir la ruta de inferencia
 * (on-device WebLLM vs fallback cloud FC-08).
 *
 * Es importante distinguir:
 *  - `isWebGPUSupported()`: check síncrono (presencia de `navigator.gpu`).
 *  - `detectWebGPU()`: check asíncrono real (`requestAdapter`), más fiable.
 *
 * FC-08 consume `getLLMCapability()` para enrutar al fallback sin cambios de UI.
 */

import type { LLMCapability } from './llmTypes';

type NavigatorWithGPU = Navigator & {
  gpu?: {
    requestAdapter?: () => Promise<unknown>;
  };
};

type NavigatorWithMemory = Navigator & {
  /** Estándar de facto (Chrome/Edge): memoria de dispositivo en GiB. */
  deviceMemory?: number;
};

function getGPU(): NavigatorWithGPU['gpu'] | undefined {
  if (typeof navigator === 'undefined') return undefined;
  return (navigator as NavigatorWithGPU).gpu;
}

/**
 * Check síncrono: el navegador expone la API WebGPU.
 * No garantiza que haya un adaptador real, pero es un buen filtro rápido.
 */
export function isWebGPUSupported(): boolean {
  return typeof getGPU() !== 'undefined';
}

/**
 * Check asíncrono fiable: intenta obtener un adaptador WebGPU real.
 * En navegadores sin WebGPU (o con GPU deshabilitada) devuelve `false`.
 */
export async function detectWebGPU(): Promise<boolean> {
  const gpu = getGPU();
  if (!gpu || typeof gpu.requestAdapter !== 'function') return false;
  try {
    const adapter = await gpu.requestAdapter();
    return adapter !== null && adapter !== undefined;
  } catch {
    return false;
  }
}

/** Memoria de dispositivo estimada en GiB (0 si no reportada). */
export function estimateDeviceMemoryGb(): number {
  if (typeof navigator === 'undefined') return 0;
  const mem = (navigator as NavigatorWithMemory).deviceMemory;
  return typeof mem === 'number' && Number.isFinite(mem) && mem > 0 ? mem : 0;
}

function isWorkerSupported(): boolean {
  return typeof globalThis.Worker === 'function';
}

/**
 * Capacidad consolidada del dispositivo.
 * `supported === false` cuando FC-08 debería tomar el relevo.
 */
export async function getLLMCapability(): Promise<LLMCapability> {
  const webgpu = await detectWebGPU();
  const worker = isWorkerSupported();
  const deviceMemoryGb = estimateDeviceMemoryGb();

  const capability: LLMCapability = {
    webgpu,
    worker,
    deviceMemoryGb: deviceMemoryGb > 0 ? deviceMemoryGb : undefined,
    supported: webgpu && worker,
  };

  if (!worker) {
    capability.reason = 'Web Worker no disponible en este entorno.';
  } else if (!webgpu) {
    capability.reason = 'WebGPU no soportado o adaptador no disponible.';
  } else if (deviceMemoryGb > 0 && deviceMemoryGb < 4) {
    // WebLLM 1B q4 necesita ~1 GB de VRAM/RAM; por debajo de 4 GB
    // recomendamos el fallback para no arriesgar DeviceLostError.
    capability.supported = false;
    capability.reason = `Memoria de dispositivo insuficiente (${deviceMemoryGb} GB).`;
  }

  return capability;
}