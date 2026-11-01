/**
 * Hook `useWhisperASR` — reconocimiento de voz on-device en Web Worker.
 *
 * Orquesta el `whisperWorker.ts` (Transformers.js Whisper) y expone una API de
 * transcripción unificada con degradación suave a Web Speech cuando el
 * dispositivo no soporta WASM SIMD/WebGPU.
 *
 * Responsabilidades:
 *  - Detectar capacidades y decidir motor (`whisper` vs `web-speech`).
 *  - Crear y gobernar el ciclo de vida del worker (sin congelar la UI).
 *  - Reportar el porcentaje de descarga del modelo (cold start).
 *  - Resolver/rechazar transcripciones pendientes por `id` (correlación).
 *
 * El audio de entrada es PCM crudo (Float32Array, 16 kHz, mono). Se copia y se
 * transfiere con zero-copy (transferable) para no mutar el buffer del llamante.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ASRCapability } from '@/services/audio/asrCapabilities';
import { detectASRCapability } from '@/services/audio/asrCapabilities';
import { transcribeWithWebSpeech, type WebSpeechTranscriber } from '@/services/audio/webSpeechASR';
import { createWhisperWorker } from '@/workers/whisperWorkerFactory';
import type {
  ASRLanguage,
  WhisperModelId,
  WhisperWorkerRequest,
  WhisperWorkerResponse,
} from '@/workers/whisperTypes';

export type ASREngine = 'whisper' | 'web-speech';

export type WhisperASRStatus =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'transcribing'
  | 'unsupported'
  | 'error';

export interface UseWhisperASROptions {
  /** Modelo a cargar (por defecto `whisper-tiny`). */
  model?: WhisperModelId;
  /** Transcripción de respaldo Web Speech (inyectable en tests). */
  webSpeechTranscriber?: WebSpeechTranscriber;
  /** Detección de capacidades (inyectable en tests). */
  detectCapability?: () => ASRCapability;
}

export interface UseWhisperASRResult {
  status: WhisperASRStatus;
  /** Motor que atenderá la transcripción. */
  engine: ASREngine;
  /** `true` si la ruta on-device (Whisper) es viable en este dispositivo. */
  supported: boolean;
  /** 0..100 — progreso acumulado de la descarga del modelo. */
  downloadProgress: number;
  /** Última transcripción finalizada. */
  transcript: string;
  error: string | null;
  /** Descarga/carga el modelo en el worker (cold start optimizado). */
  load: () => Promise<void>;
  /** Transcribe un buffer de audio (resuelve con el texto). */
  transcribe: (audioBuffer: Float32Array, language?: ASRLanguage) => Promise<string>;
  /** Cancela las transcripciones en curso. */
  abort: () => void;
}

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
}

function createDeferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

let idCounter = 0;
function generateId(): string {
  idCounter += 1;
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `whisper-${Date.now().toString(36)}-${idCounter}`;
}

/** Copia el audio a un buffer propio (transferable correcto, sin subarrays). */
function copyFloat32(input: Float32Array): Float32Array {
  const copy = new Float32Array(input.length);
  copy.set(input);
  return copy;
}

/**
 * Agrega los progresos por archivo en un 0..100 acumulado. Puro para testear.
 */
export function aggregateDownloadProgress(
  files: ReadonlyMap<string, { loaded: number; total: number }>,
): number {
  let loaded = 0;
  let total = 0;
  for (const file of files.values()) {
    if (file.total > 0) {
      loaded += Math.min(file.loaded, file.total);
      total += file.total;
    }
  }
  return total > 0 ? Math.min(100, Math.round((loaded / total) * 100)) : 0;
}

export function useWhisperASR(options: UseWhisperASROptions = {}): UseWhisperASRResult {
  const [capability] = useState<ASRCapability>(
    () => options.detectCapability?.() ?? detectASRCapability(),
  );
  const [status, setStatus] = useState<WhisperASRStatus>(capability.supported ? 'idle' : 'unsupported');
  const [engine, setEngine] = useState<ASREngine>(capability.supported ? 'whisper' : 'web-speech');
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const supported = capability.supported;

  const workerRef = useRef<Worker | null>(null);
  const pending = useRef<Map<string, Deferred<string>>>(new Map());
  const progressByFile = useRef<Map<string, { loaded: number; total: number }>>(new Map());
  const loadDeferred = useRef<Deferred<void> | null>(null);
  const loadDone = useRef(false);
  const modelRef = useRef<WhisperModelId>(options.model ?? 'whisper-tiny');
  const webSpeechRef = useRef<WebSpeechTranscriber>(
    options.webSpeechTranscriber ?? transcribeWithWebSpeech,
  );

  modelRef.current = options.model ?? 'whisper-tiny';
  webSpeechRef.current = options.webSpeechTranscriber ?? transcribeWithWebSpeech;

  const rejectAll = useCallback((err: Error): void => {
    for (const deferred of pending.current.values()) deferred.reject(err);
    pending.current.clear();
    loadDeferred.current?.reject(err);
    loadDeferred.current = null;
    loadDone.current = false;
  }, []);

  const ensureWorker = useCallback((): Worker => {
    if (workerRef.current) return workerRef.current;

    const worker = createWhisperWorker();
    worker.onmessage = (event: MessageEvent<WhisperWorkerResponse>) => {
      const msg = event.data;
      switch (msg.type) {
        case 'progress': {
          const p = msg.progress;
          if (typeof p.file === 'string' && typeof p.loaded === 'number' && typeof p.total === 'number') {
            progressByFile.current.set(p.file, { loaded: p.loaded, total: p.total });
            setDownloadProgress(aggregateDownloadProgress(progressByFile.current));
          }
          if (!loadDone.current) setStatus('loading');
          break;
        }
        case 'ready': {
          loadDone.current = true;
          setDownloadProgress(100);
          setStatus('ready');
          setEngine('whisper');
          setError(null);
          loadDeferred.current?.resolve();
          loadDeferred.current = null;
          break;
        }
        case 'transcription': {
          const deferred = pending.current.get(msg.id);
          if (deferred) {
            pending.current.delete(msg.id);
            deferred.resolve(msg.text);
          }
          break;
        }
        case 'aborted': {
          const deferred = pending.current.get(msg.id);
          if (deferred) {
            pending.current.delete(msg.id);
            deferred.resolve('');
          }
          break;
        }
        case 'error': {
          setError(msg.message);
          if (msg.id) {
            const deferred = pending.current.get(msg.id);
            if (deferred) {
              pending.current.delete(msg.id);
              deferred.reject(new Error(msg.message));
            }
          } else {
            loadDeferred.current?.reject(new Error(msg.message));
            loadDeferred.current = null;
          }
          if (msg.code === 'UNSUPPORTED') {
            // El runtime (WebAssembly/WebGPU) no pudo inicializarse en el
            // worker: degradamos suavemente a Web Speech.
            setStatus('unsupported');
            setEngine('web-speech');
          } else {
            setStatus('error');
          }
          break;
        }
      }
    };

    worker.onerror = () => {
      setError('Error en el Worker de ASR.');
      rejectAll(new Error('Error en el Worker de ASR.'));
      setStatus('error');
    };

    workerRef.current = worker;
    return worker;
  }, [rejectAll]);

  const ensureLoaded = useCallback((): Promise<void> => {
    if (loadDone.current) return Promise.resolve();
    if (loadDeferred.current) return loadDeferred.current.promise;

    const deferred = createDeferred<void>();
    loadDeferred.current = deferred;
    setStatus('loading');
    setEngine('whisper');
    setError(null);
    ensureWorker().postMessage({ action: 'load', model: modelRef.current } as WhisperWorkerRequest);
    return deferred.promise;
  }, [ensureWorker]);

  const load = useCallback(async (): Promise<void> => {
    if (!supported) return; // el fallback Web Speech no tiene modelo que precargar
    await ensureLoaded();
  }, [supported, ensureLoaded]);

  const transcribe = useCallback(
    async (audioBuffer: Float32Array, language: ASRLanguage = 'en'): Promise<string> => {
      setTranscript('');
      setError(null);

      // Ruta de respaldo (Web Speech) cuando on-device no es viable.
      if (!capability.supported) {
        setEngine('web-speech');
        setStatus('transcribing');
        try {
          const text = await webSpeechRef.current(language);
          setTranscript(text);
          setStatus('idle');
          return text;
        } catch (err) {
          setError(err instanceof Error ? err.message : String(err));
          setStatus('error');
          throw err;
        }
      }

      // Ruta on-device (Whisper worker).
      setEngine('whisper');
      try {
        await ensureLoaded();

        const id = generateId();
        const deferred = createDeferred<string>();
        pending.current.set(id, deferred);

        const buffer = copyFloat32(audioBuffer);
        setStatus('transcribing');
        ensureWorker().postMessage(
          { action: 'transcribe', id, audioBuffer: buffer, language } as WhisperWorkerRequest,
          [buffer.buffer],
        );

        const text = await deferred.promise;
        setTranscript(text);
        setStatus('ready');
        return text;
      } catch (err) {
        // El error ya se propagó por `onmessage` (estado `error`); aquí solo
        // aseguramos el estado y re-lanzamos para el consumidor.
        setStatus('error');
        throw err;
      }
    },
    [capability.supported, ensureLoaded, ensureWorker],
  );

  const abort = useCallback((): void => {
    setStatus('idle');
    rejectAll(new Error('Transcripción cancelada.'));
    if (workerRef.current) {
      workerRef.current.postMessage({ action: 'abort' } as WhisperWorkerRequest);
    }
  }, [rejectAll]);

  useEffect(() => {
    return () => {
      // Limpieza al desmontar: terminar el worker y soltar pendientes sin
      // rechazarlas (nadie las espera tras el unmount; rechazar generaría
      // rechazos no manejados).
      pending.current.clear();
      loadDeferred.current = null;
      loadDone.current = false;
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  return {
    status,
    engine,
    supported,
    downloadProgress,
    transcript,
    error,
    load,
    transcribe,
    abort,
  };
}