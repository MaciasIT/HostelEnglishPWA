/**
 * Detección de capacidades para decidir la ruta de ASR on-device (Whisper)
 * frente al fallback Web Speech.
 *
 * Regla de decisión (spec FC-02): Whisper es viable si hay Web Worker Y el
 * hardware soporta WASM SIMD o WebGPU. Si no, se degrada suavemente a la Web
 * Speech API sin romper la funcionalidad.
 *
 * ⚠️ NOTA DE COORDINACIÓN: `src/services/llm/webgpuDetection.ts` (track LLM)
 * y `src/services/audio/capabilities.ts` (track TTS) detectan WebGPU/memoria
 * por separado. Este módulo es autocontenido a propósito (no depende de
 * código sibling no commiteado); las tres utilidades conviene consolidarlas
 * en un módulo compartido más adelante.
 */

/** Bytes de la cabecera mágica de WebAssembly (módulo vacío válido). */
const WASM_MAGIC = new Uint8Array([0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00]);

/** Módulo Wasm mínimo con la instrucción SIMD `v128` (función vacía). */
const WASM_SIMD = new Uint8Array([
  0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00, 0x01, 0x05, 0x01, 0x60, 0x00, 0x01, 0x7b,
]);

/** Fuente de capacidades del entorno (inyectable para tests deterministas). */
export interface ASRCapabilitySource {
  navigator?: { gpu?: unknown };
  Worker?: unknown;
  WebAssembly?: { validate?: (bytes: Uint8Array) => boolean };
}

/** Capacidades y decisión de ruta para el ASR. */
export interface ASRCapability {
  /** WebGPU disponible (`navigator.gpu`). */
  webgpu: boolean;
  /** WebAssembly disponible (cabecera mágica válida). */
  wasm: boolean;
  /** WASM con instrucciones SIMD (`v128`). */
  wasmSimd: boolean;
  /** Web Worker disponible. */
  worker: boolean;
  /** `true` si la ruta on-device (Whisper) es viable. */
  supported: boolean;
  /** Motivo de la no-viabilidad (para diagnóstico y telemetría local). */
  reason?: string;
}

/**
 * Detección síncrona y pura. No lanza: un entorno degradado devuelve
 * `supported: false` con su `reason`, nunca una excepción.
 */
export function detectASRCapability(
  source: ASRCapabilitySource = globalThis as unknown as ASRCapabilitySource,
): ASRCapability {
  const navigator = source.navigator ?? {};
  const webgpu = typeof navigator.gpu !== 'undefined';
  const worker = typeof source.Worker === 'function';

  const validate = source.WebAssembly?.validate;
  const wasm = typeof validate === 'function' && validate(WASM_MAGIC);
  const wasmSimd = typeof validate === 'function' && validate(WASM_SIMD);

  const supported = worker && wasm && (wasmSimd || webgpu);

  const result: ASRCapability = { webgpu, wasm, wasmSimd, worker, supported };
  if (!worker) {
    result.reason = 'Web Worker no disponible en este entorno.';
  } else if (!wasm) {
    result.reason = 'WebAssembly no disponible en este navegador.';
  } else if (!wasmSimd && !webgpu) {
    result.reason = 'Sin WASM SIMD ni WebGPU: se usará Web Speech.';
  }
  return result;
}