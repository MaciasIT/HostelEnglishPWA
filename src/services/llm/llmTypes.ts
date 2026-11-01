/**
 * Tipos y constantes compartidos del motor LLM on-device (FC-07).
 *
 * Estos tipos viajan entre el hilo principal (`LocalLLMEngine`) y el Web Worker
 * (`llm.worker.ts`) mediante `postMessage`, por lo que todos los mensajes deben ser
 * serializables con structured clone (objetos planos, string, number, boolean, arrays).
 * No incluir funciones, Map, Set ni referencias.
 */

export type LLMRole = 'system' | 'user' | 'assistant';

export interface LLMChatMessage {
  role: LLMRole;
  content: string;
}

/** Uso de tokens reportado por WebLLM en el último chunk de stream. */
export interface TokenUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
}

/** Resultado final de una generación devuelto a `onComplete` / promesa. */
export interface LLMCompletionResult {
  /** Identificador de la petición generado por el hilo principal. */
  id: string;
  fullText: string;
  usage?: TokenUsage;
  /** Tokens de salida por segundo, medido por el worker. */
  tokPerSec?: number;
  finishReason?: string;
  elapsedMs: number;
}

export interface LLMGenerateOptions {
  /** Número máximo de tokens a generar en el turno (por defecto 256). */
  maxTokens?: number;
  /** Temperatura de muestreo (por defecto 0.7). */
  temperature?: number;
  /** Nucleus sampling top_p (por defecto 0.9). */
  topP?: number;
  /** Secuencias de parada adicionales. */
  stop?: string[];
}

/**
 * Backend de caché de pesos soportado por WebLLM (`AppConfig.cacheBackend`).
 * "cache" (Cache Storage) es el más estable; "opfs" usa Origin Private File System.
 */
export type LLMCacheBackend = 'cache' | 'indexeddb' | 'opfs';

export interface LLMLoadOptions {
  /** Modelo MLC. Por defecto el ultra-ligero de 1B cuantizado 4-bit. */
  modelId?: string;
  /** Ventana de contexto en tokens (tamaño del KV cache). 1024 para hostelería. */
  contextWindowSize?: number;
  temperature?: number;
  topP?: number;
  cacheBackend?: LLMCacheBackend;
}

export interface LLMLoadProgress {
  /** Progreso 0..1 de la descarga/carga del modelo. */
  progress: number;
  text: string;
  timeElapsed: number;
}

export interface LLMCapability {
  /** `true` si el navegador expone WebGPU. */
  webgpu: boolean;
  /** `true` si hay `Worker` disponible (necesario para no bloquear UI). */
  worker: boolean;
  /** Memoria de dispositivo estimada (GB), si el navegador la reporta. */
  deviceMemoryGb?: number;
  /** Razón por la que se debería usar el fallback cloud (FC-08). */
  reason?: string;
  /** `true` cuando el motor local puede ejecutarse en este dispositivo. */
  supported: boolean;
}

/** Códigos de error del motor local, consumidos para decidir el fallback (FC-08). */
export type LLMErrorCode =
  | 'WEBGPU_UNSUPPORTED'
  | 'DEVICE_LOST'
  | 'OOM'
  | 'DOWNLOAD_FAILED'
  | 'LOAD_FAILED'
  | 'GENERATION_FAILED'
  | 'WORKER_UNAVAILABLE'
  | 'ABORTED'
  | 'UNKNOWN';

export interface LLMError {
  id?: string;
  code: LLMErrorCode;
  message: string;
}

/* ------------------------------------------------------------------------- */
/* Valores por defecto                                                        */
/* ------------------------------------------------------------------------- */

export const DEFAULT_MODEL_ID = 'Llama-3.2-1B-Instruct-q4f16_1-MLC';

/**
 * Ventana de contexto por defecto (tokens).
 * Reducir a 1024 (frente a los 131072 del modelo base) reduce el KV cache
 * de ~2.9 GB a ~0.88 GB para Llama-3.2-1B, manteniendo la inferencia viable
 * en móviles de gama media. Suficiente para turnos cortos de hostelería.
 */
export const DEFAULT_CONTEXT_WINDOW = 1024;

/** Tokens de salida reservados por turno dentro de la ventana de contexto. */
export const DEFAULT_MAX_TOKENS = 256;

export const DEFAULT_TEMPERATURE = 0.7;
export const DEFAULT_TOP_P = 0.9;