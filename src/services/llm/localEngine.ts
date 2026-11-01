/**
 * Motor LLM on-device (hilo principal).
 *
 * Controlador del Web Worker que hospeda WebLLM. Expone una API con eventos
 * `onToken` / `onComplete` / `onError` y gestiona:
 *  - ciclo de vida del worker y del modelo (load / unload / reset).
 *  - control de la ventana de contexto (recorte del historial a 1024 tokens).
 *  - medición de tok/s (reportada por el worker).
 *
 * FC-08 usa `LocalLLMEngine.getCapability()` para saltar al fallback cloud
 * cuando WebGPU no está disponible, sin cambios en la interfaz de usuario.
 */

import type { LLMWorkerRequest, LLMWorkerResponse } from '@/workers/llm.worker';
import { createLLMWorker } from '@/workers/llmWorkerFactory';
import { getLLMCapability } from './webgpuDetection';
import { truncateMessagesToContextWindow } from './contextWindow';
import {
  DEFAULT_CONTEXT_WINDOW,
  DEFAULT_MAX_TOKENS,
  DEFAULT_MODEL_ID,
} from './llmTypes';
import type {
  LLMCacheBackend,
  LLMCapability,
  LLMChatMessage,
  LLMCompletionResult,
  LLMError,
  LLMGenerateOptions,
  LLMLoadProgress,
} from './llmTypes';

export interface LocalLLMEngineConfig {
  modelId?: string;
  contextWindowSize?: number;
  temperature?: number;
  topP?: number;
  cacheBackend?: LLMCacheBackend;
}

export interface GenerateCallbacks {
  /** Invocado con cada delta de token y el texto parcial acumulado. */
  onToken?: (token: string, partial: string) => void;
  /** Invocado al finalizar la generación (evento `onComplete`). */
  onComplete?: (result: LLMCompletionResult) => void;
  /** Invocado ante cualquier error de carga o generación. */
  onError?: (error: LLMError) => void;
}

export type LLMEngineState = 'idle' | 'loading' | 'ready' | 'error';

interface PendingGeneration {
  id: string;
  callbacks: GenerateCallbacks;
  resolve: (result: LLMCompletionResult) => void;
  reject: (error: LLMError) => void;
  partial: string;
}

interface Deferred<T> {
  resolve: (value: T) => void;
  reject: (error: LLMError) => void;
  promise: Promise<T>;
}

let idCounter = 0;

function generateId(): string {
  idCounter += 1;
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${idCounter}`;
}

export class LocalLLMEngine {
  private worker: Worker | null = null;
  private state: LLMEngineState = 'idle';
  private pending = new Map<string, PendingGeneration>();
  private loadDeferred: Deferred<void> | null = null;
  private resetDeferred: Deferred<void> | null = null;
  private unloadDeferred: Deferred<void> | null = null;
  private onProgress: ((progress: LLMLoadProgress) => void) | null = null;

  private readonly modelId: string;
  private readonly contextWindowSize: number;
  private readonly temperature: number;
  private readonly topP: number;
  private readonly cacheBackend: LLMCacheBackend;

  constructor(config: LocalLLMEngineConfig = {}) {
    this.modelId = config.modelId ?? DEFAULT_MODEL_ID;
    this.contextWindowSize = config.contextWindowSize ?? DEFAULT_CONTEXT_WINDOW;
    this.temperature = config.temperature ?? 0.7;
    this.topP = config.topP ?? 0.9;
    this.cacheBackend = config.cacheBackend ?? 'cache';
  }

  get engineState(): LLMEngineState {
    return this.state;
  }

  get loadedModelId(): string {
    return this.modelId;
  }

  get windowSize(): number {
    return this.contextWindowSize;
  }

  /** Capacidad del dispositivo; `supported:false` ⇒ usar fallback cloud (FC-08). */
  static async getCapability(): Promise<LLMCapability> {
    return getLLMCapability();
  }

  /** Reemplazable en tests (subclase o mock del módulo factory). */
  protected createWorker(): Worker {
    return createLLMWorker();
  }

  private ensureWorker(): Worker {
    if (this.worker) return this.worker;

    let worker: Worker;
    try {
      worker = this.createWorker();
    } catch (error) {
      throw new Error(`Web Worker no disponible: ${String(error)}`);
    }

    worker.onmessage = (event: MessageEvent<LLMWorkerResponse>) => {
      this.handleWorkerMessage(event.data);
    };
    worker.onerror = (event: ErrorEvent) => {
      this.handleGlobalError(
        event.message || 'Error inesperado en el Worker del LLM.',
        'WORKER_UNAVAILABLE',
      );
    };

    this.worker = worker;
    return worker;
  }

  private post(request: LLMWorkerRequest): void {
    this.ensureWorker().postMessage(request);
  }

  private handleWorkerMessage(message: LLMWorkerResponse): void {
    switch (message.type) {
      case 'PROGRESS':
        this.onProgress?.({
          progress: message.progress,
          text: message.text,
          timeElapsed: message.timeElapsed,
        });
        break;

      case 'READY':
        this.state = 'ready';
        this.loadDeferred?.resolve();
        this.loadDeferred = null;
        break;

      case 'TOKEN': {
        const pending = this.pending.get(message.id);
        if (pending) {
          pending.partial += message.token;
          pending.callbacks.onToken?.(message.token, pending.partial);
        }
        break;
      }

      case 'COMPLETE': {
        const pending = this.pending.get(message.id);
        if (pending) {
          this.pending.delete(message.id);
          const result: LLMCompletionResult = {
            id: message.id,
            fullText: message.fullText,
            usage: message.usage,
            tokPerSec: message.tokPerSec,
            finishReason: message.finishReason,
            elapsedMs: message.elapsedMs,
          };
          pending.callbacks.onComplete?.(result);
          pending.resolve(result);
        }
        break;
      }

      case 'ABORTED': {
        const pending = this.pending.get(message.id);
        if (pending) {
          this.pending.delete(message.id);
          pending.reject({ id: message.id, code: 'ABORTED', message: 'Generación cancelada.' });
        }
        break;
      }

      case 'ERROR': {
        const error: LLMError = { id: message.id, code: message.code, message: message.message };
        // Error de una generación específica.
        if (message.id && this.pending.has(message.id)) {
          const pending = this.pending.get(message.id)!;
          this.pending.delete(message.id);
          pending.callbacks.onError?.(error);
          pending.reject(error);
          return;
        }
        // Error de carga.
        if (this.loadDeferred) {
          this.state = 'error';
          this.loadDeferred.reject(error);
          this.loadDeferred = null;
          return;
        }
        // Error global sin destinatario claro.
        this.handleGlobalError(error.message, error.code);
        break;
      }

      case 'RESET_DONE':
        this.resetDeferred?.resolve();
        this.resetDeferred = null;
        break;

      case 'UNLOAD_DONE':
        this.state = 'idle';
        this.unloadDeferred?.resolve();
        this.unloadDeferred = null;
        break;

      case 'GPU_INFO':
        // Sin consumidor directo; disponible si el caller lo necesita vía evento futuro.
        break;
    }
  }

  private handleGlobalError(message: string, code: LLMError['code']): void {
    const error: LLMError = { code, message };
    if (this.loadDeferred) {
      this.state = 'error';
      this.loadDeferred.reject(error);
      this.loadDeferred = null;
    }
    for (const pending of this.pending.values()) {
      pending.callbacks.onError?.(error);
      pending.reject(error);
    }
    this.pending.clear();
  }

  /**
   * Carga el modelo. Resuelve en `ready`; `onProgress` recibe el avance 0..1
   * de descarga/carga (alimenta el indicador de carga inicial).
   */
  load(onProgress?: (progress: LLMLoadProgress) => void): Promise<void> {
    if (this.state === 'ready' || this.loadDeferred) {
      return Promise.resolve();
    }

    this.state = 'loading';
    this.onProgress = onProgress ?? null;

    if (!this.loadDeferred) {
      this.loadDeferred = this.makeDeferred<void>();
    }

    const deferred = this.loadDeferred;
    try {
      this.post({
        type: 'LOAD',
        options: {
          modelId: this.modelId,
          contextWindowSize: this.contextWindowSize,
          temperature: this.temperature,
          topP: this.topP,
          cacheBackend: this.cacheBackend,
        },
      });
    } catch (error) {
      this.state = 'error';
      this.loadDeferred = null;
      deferred.reject({ code: 'WORKER_UNAVAILABLE', message: String(error) });
    }

    return deferred.promise;
  }

  /**
   * Genera una respuesta con streaming token a token.
   * Recorta el historial a la ventana de contexto antes de enviarlo al worker.
   */
  generate(
    messages: LLMChatMessage[],
    callbacks: GenerateCallbacks = {},
    options: LLMGenerateOptions = {},
  ): Promise<LLMCompletionResult> {
    const id = generateId();
    const maxTokens = options.maxTokens ?? DEFAULT_MAX_TOKENS;
    const trimmed = truncateMessagesToContextWindow(
      messages,
      this.contextWindowSize,
      maxTokens,
    );

    return new Promise<LLMCompletionResult>((resolve, reject) => {
      const pending: PendingGeneration = {
        id,
        callbacks,
        resolve,
        reject,
        partial: '',
      };
      this.pending.set(id, pending);

      try {
        this.post({
          type: 'GENERATE',
          id,
          messages: trimmed,
          options: {
            maxTokens,
            temperature: options.temperature,
            topP: options.topP,
            stop: options.stop,
          },
        });
      } catch (error) {
        this.pending.delete(id);
        reject({ id, code: 'WORKER_UNAVAILABLE', message: String(error) } as LLMError);
      }
    });
  }

  /** Cancela la generación activa (o la identificada por `id`). */
  abort(id?: string): void {
    this.post({ type: 'ABORT', id });
  }

  /** Libera el historial interno del modelo (conserva el modelo cargado). */
  async reset(): Promise<void> {
    if (!this.worker) return;
    if (!this.resetDeferred) {
      this.resetDeferred = this.makeDeferred<void>();
      this.post({ type: 'RESET' });
    }
    return this.resetDeferred.promise;
  }

  /** Descarga el modelo y libera la memoria del dispositivo (WebGPU). */
  async unload(): Promise<void> {
    if (!this.worker) return;
    if (!this.unloadDeferred) {
      this.unloadDeferred = this.makeDeferred<void>();
      this.post({ type: 'UNLOAD' });
    }
    return this.unloadDeferred.promise;
  }

  /** Termina el worker y libera todos los recursos. */
  dispose(): void {
    this.handleGlobalError('Motor LLM destruido.', 'ABORTED');
    this.worker?.terminate();
    this.worker = null;
    this.state = 'idle';
    this.onProgress = null;
    this.loadDeferred = null;
    this.resetDeferred = null;
    this.unloadDeferred = null;
  }

  private makeDeferred<T>(): Deferred<T> {
    let resolve!: (value: T) => void;
    let reject!: (error: LLMError) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { resolve, reject, promise };
  }
}

/** Instancia única compartida (singleton) del motor local. */
let defaultEngine: LocalLLMEngine | null = null;

export function getLocalLLMEngine(config?: LocalLLMEngineConfig): LocalLLMEngine {
  if (!defaultEngine) {
    defaultEngine = new LocalLLMEngine(config);
  }
  return defaultEngine;
}