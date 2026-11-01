/// <reference lib="WebWorker" />

/**
 * Web Worker dedicado que hospeda el pipeline ASR Whisper (Transformers.js).
 *
 * La inferencia se ejecuta FUERA del hilo principal, garantizando cero
 * congelamientos de frame en la UI durante el cálculo. El modelo se descarga
 * una sola vez y Transformers.js lo cachea en la Cache Storage del navegador,
 * de modo que las siguientes sesiones arrancan *offline* (sin red) tras la
 * primera descarga.
 *
 * Protocolo (structured-clone):
 *
 *   Main ──> Worker                  Worker ──> Main
 *   { action: 'load' }               { type: 'progress' } (por archivo)
 *   { action: 'transcribe', ... }    { type: 'ready' }
 *   { action: 'abort' }              { type: 'transcription' }
 *                                    { type: 'error' }
 *                                    { type: 'aborted' }
 *
 * El audio de entrada es PCM crudo (Float32Array, 16 kHz, mono). Es
 * responsabilidad del productor (p. ej. `useMicrophone` + AudioWorklet en
 * una fase posterior) resamplear a 16 kHz antes de postear.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * NOTA DE COORDINACIÓN (ASR vs LLM): el track LLM usa `@mlc-ai/web-llm` en
 * `llm.worker.ts`. Este worker usa `@huggingface/transformers` (spec F1
 * "ASR en Web Worker con Whisper"). Ambos conviven en `src/workers/` con
 * factories propias; no comparten runtime.
 */

import { pipeline } from '@huggingface/transformers';
import type {
  ASRLanguage,
  WhisperErrorCode,
  WhisperModelId,
  WhisperProgressInfo,
  WhisperWorkerRequest,
  WhisperWorkerResponse,
} from './whisperTypes';

/** Modelo por defecto: tiny q8 (~39 MB) para cold start rápido en móvil. */
const DEFAULT_MODEL: WhisperModelId = 'whisper-tiny';

/** Interfaz mínima del callable ASR (se evita acoplar a los tipos internos de Transformers.js). */
interface WhisperPipeline {
  (
    audio: Float32Array,
    options?: { language?: string; task?: string; return_timestamps?: boolean },
  ): Promise<{ text?: string } | Array<{ text?: string }>>;
  dispose?: () => Promise<void>;
}

/* ------------------------------ Estado -------------------------------- */

let loadPromise: Promise<WhisperPipeline> | null = null;
let currentModel: WhisperModelId = DEFAULT_MODEL;

/** IDs de transcripciones en curso (para poder cancelarlas de golpe). */
const inflightIds = new Set<string>();

/** IDs de transcripciones canceladas (se descartan cuando llega su resultado). */
const abortedIds = new Set<string>();

function post(message: WhisperWorkerResponse): void {
  (self as unknown as { postMessage: (msg: WhisperWorkerResponse) => void }).postMessage(message);
}

function repo(model: WhisperModelId): string {
  return `onnx-community/${model}`;
}

function mapErrorCode(err: unknown): WhisperErrorCode {
  const message = err instanceof Error ? err.message : String(err);
  const lower = message.toLowerCase();
  if (lower.includes('fetch') || lower.includes('download') || lower.includes('network') || lower.includes('status 4') || lower.includes('status 5')) {
    return 'DOWNLOAD_FAILED';
  }
  if (lower.includes('webassembly') || lower.includes('wasm') || lower.includes('simd') || lower.includes('webgpu')) {
    return 'UNSUPPORTED';
  }
  if (lower.includes('load') || lower.includes('config') || lower.includes('model')) {
    return 'MODEL_LOAD_FAILED';
  }
  return 'INFERENCE_FAILED';
}

/* ------------------------------- Carga --------------------------------- */

async function ensurePipeline(model: WhisperModelId): Promise<WhisperPipeline> {
  if (!loadPromise) {
    loadPromise = pipeline(
      'automatic-speech-recognition',
      repo(model),
      {
        dtype: 'q8',
        progress_callback: (p: { status?: string; file?: string; name?: string; progress?: number; loaded?: number; total?: number }) => {
          const info: WhisperProgressInfo = {
            status: (p.status as WhisperProgressInfo['status']) ?? 'progress',
            file: p.file,
            name: p.name,
            progress: p.progress,
            loaded: p.loaded,
            total: p.total,
          };
          post({ type: 'progress', progress: info });
        },
      },
    ) as unknown as Promise<WhisperPipeline>;
  }
  return loadPromise;
}

/* ---------------------------- Transcripción ---------------------------- */

async function transcribe(id: string, audioBuffer: Float32Array, language: ASRLanguage): Promise<void> {
  inflightIds.add(id);
  try {
    const pipe = await ensurePipeline(currentModel);
    const start = performance.now();
    const output = await pipe(audioBuffer, {
      language,
      task: 'transcribe',
      return_timestamps: false,
    });
    const latencyMs = performance.now() - start;
    const text = (Array.isArray(output) ? output[0]?.text : output?.text) ?? '';

    if (abortedIds.has(id)) {
      abortedIds.delete(id);
      post({ type: 'aborted', id });
      return;
    }
    post({ type: 'transcription', id, text, language, latencyMs });
  } catch (err) {
    const error = err as { message?: string };
    post({ type: 'error', id, code: mapErrorCode(err), message: error.message ?? String(err) });
  } finally {
    inflightIds.delete(id);
  }
}

/* ------------------------------ Mensajes ------------------------------- */

self.onmessage = (event: MessageEvent<WhisperWorkerRequest>) => {
  const msg = event.data;
  switch (msg.action) {
    case 'load': {
      currentModel = msg.model ?? currentModel;
      void ensurePipeline(currentModel)
        .then(() => post({ type: 'ready', model: currentModel }))
        .catch((err: unknown) => {
          const error = err as { message?: string };
          post({ type: 'error', code: mapErrorCode(err), message: error.message ?? String(err) });
        });
      break;
    }
    case 'transcribe': {
      void transcribe(msg.id, msg.audioBuffer, msg.language);
      break;
    }
    case 'abort': {
      // onnxruntime-web no expone cancelación a mitad de inferencia; se marcan
      // los ids en curso y se descartan sus resultados cuando terminen
      // (la UI se desbloquea inmediatamente desde el hook, sin esperar aquí).
      for (const id of inflightIds) abortedIds.add(id);
      break;
    }
  }
};