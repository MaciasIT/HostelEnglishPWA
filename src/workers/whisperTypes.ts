/**
 * Tipos compartidos del worker de ASR on-device (Whisper / Transformers.js).
 *
 * Este módulo es *puro* (sin dependencias) a propósito: lo importan tanto el
 * `whisperWorker.ts` (contexto Web Worker) como el hook `useWhisperASR`
 * (contexto React) sin crear ciclos de imports ni arrastrar `@huggingface/transformers`
 * al hilo principal.
 */

/** Idiomas soportados por el reconocedor (alineado con la capa de audio FC-01). */
export type ASRLanguage = 'en' | 'es' | 'eu';

/** Tamaños de modelo Whisper on-device soportados (cuantizados q8). */
export type WhisperModelId = 'whisper-tiny' | 'whisper-base';

/**
 * Peticiones del hilo principal → worker, discriminadas por `action`.
 *
 * `transcribe` transporta el audio PCM crudo en un `Float32Array` (16 kHz,
 * mono) y se transfiere con zero-copy (transferable) para no copiar el buffer.
 */
export type WhisperWorkerRequest =
  | { action: 'load'; model?: WhisperModelId }
  | { action: 'transcribe'; id: string; audioBuffer: Float32Array; language: ASRLanguage }
  | { action: 'abort' };

/**
 * Snapshot del progreso de descarga/carga del modelo por archivo.
 * Campos directamente mapeados del `ProgressInfo` de Transformers.js.
 */
export interface WhisperProgressInfo {
  status: 'initiate' | 'download' | 'progress' | 'done' | 'ready' | string;
  file?: string;
  name?: string;
  /** 0..100 (semántica de Transformers.js `ProgressStatusInfo`). */
  progress?: number;
  /** Bytes descargados del archivo actual. */
  loaded?: number;
  /** Bytes totales del archivo actual. */
  total?: number;
}

/** Códigos de error tipados para que el hook pueda enrutar al fallback. */
export type WhisperErrorCode =
  | 'MODEL_LOAD_FAILED'
  | 'DOWNLOAD_FAILED'
  | 'INFERENCE_FAILED'
  | 'UNSUPPORTED'
  | 'UNKNOWN';

/** Respuestas del worker → hilo principal, discriminadas por `type`. */
export type WhisperWorkerResponse =
  | { type: 'ready'; model: WhisperModelId }
  | { type: 'progress'; progress: WhisperProgressInfo }
  | { type: 'transcription'; id: string; text: string; language: ASRLanguage; latencyMs: number }
  | { type: 'error'; id?: string; code: WhisperErrorCode; message: string }
  | { type: 'aborted'; id: string };