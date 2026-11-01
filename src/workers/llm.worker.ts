/// <reference lib="WebWorker" />

/**
 * Web Worker dedicado que hospeda el runtime WebLLM (MLCEngine).
 *
 * Ejecuta la inferencia fuera del hilo principal para no bloquear la UI.
 * Protocolo de mensajes (structured-clone) hacia el hilo principal:
 *
 *   Hilo principal ──> Worker      Worker ──> Hilo principal
 *   LOAD                          PROGRESS (carga incremental)
 *   GENERATE (stream)             TOKEN / COMPLETE / ERROR
 *   ABORT                         ABORTED
 *   RESET                         RESET_DONE
 *   UNLOAD                        UNLOAD_DONE
 *   GPU_INFO                      GPU_INFO
 */

import { MLCEngine, prebuiltAppConfig } from '@mlc-ai/web-llm';
import type {
  AppConfig,
  InitProgressReport,
  MLCEngineConfig,
} from '@mlc-ai/web-llm';
import {
  DEFAULT_CONTEXT_WINDOW,
  DEFAULT_MAX_TOKENS,
  DEFAULT_MODEL_ID,
  DEFAULT_TEMPERATURE,
  DEFAULT_TOP_P,
} from '../services/llm/llmTypes';
import type {
  LLMCacheBackend,
  LLMChatMessage,
  LLMErrorCode,
  LLMGenerateOptions,
  LLMLoadOptions,
  TokenUsage,
} from '../services/llm/llmTypes';

/* ----------------------------- Protocolo ------------------------------ */

export type LLMWorkerRequest =
  | { type: 'LOAD'; options: LLMLoadOptions }
  | { type: 'GENERATE'; id: string; messages: LLMChatMessage[]; options?: LLMGenerateOptions }
  | { type: 'ABORT'; id?: string }
  | { type: 'RESET' }
  | { type: 'UNLOAD' }
  | { type: 'GPU_INFO'; id: string };

export type LLMWorkerResponse =
  | { type: 'PROGRESS'; progress: number; text: string; timeElapsed: number }
  | { type: 'READY'; modelId: string; vendor: string; contextWindowSize: number }
  | { type: 'TOKEN'; id: string; token: string }
  | {
      type: 'COMPLETE';
      id: string;
      fullText: string;
      usage?: TokenUsage;
      tokPerSec?: number;
      finishReason?: string;
      elapsedMs: number;
    }
  | { type: 'ABORTED'; id: string }
  | { type: 'ERROR'; id?: string; code: LLMErrorCode; message: string }
  | { type: 'GPU_INFO'; id: string; vendor: string; maxStorageBufferBindingSize: number }
  | { type: 'RESET_DONE' }
  | { type: 'UNLOAD_DONE' };

/* ------------------------------ Estado -------------------------------- */

let engine: MLCEngine | null = null;
let currentContextWindow = DEFAULT_CONTEXT_WINDOW;
let activeGenerationId: string | null = null;
const abortedIds = new Set<string>();

function post(message: LLMWorkerResponse): void {
  self.postMessage(message);
}

function mapError(error: unknown, fallback: LLMErrorCode = 'UNKNOWN'): { code: LLMErrorCode; message: string } {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();

  if (lower.includes('webgpu') && (lower.includes('not support') || lower.includes('unavailable'))) {
    return { code: 'WEBGPU_UNSUPPORTED', message };
  }
  if (lower.includes('device lost') || lower.includes('devicelost') || lower.includes('device was lost')) {
    return { code: 'DEVICE_LOST', message };
  }
  if (lower.includes('out of memory') || lower.includes('oom')) {
    return { code: 'OOM', message };
  }
  if (lower.includes('fetch failed') || lower.includes('failed to fetch') || lower.includes('download') || lower.includes('status 4')) {
    return { code: 'DOWNLOAD_FAILED', message };
  }
  return { code: fallback, message };
}

function buildAppConfig(cacheBackend?: LLMCacheBackend): AppConfig {
  return {
    model_list: prebuiltAppConfig.model_list,
    cacheBackend: cacheBackend ?? 'cache',
  };
}

/* ------------------------------- Carga --------------------------------- */

async function loadOnce(options: LLMLoadOptions): Promise<void> {
  const modelId = options.modelId ?? DEFAULT_MODEL_ID;
  const contextWindowSize = options.contextWindowSize ?? DEFAULT_CONTEXT_WINDOW;

  const engineConfig: MLCEngineConfig = {
    appConfig: buildAppConfig(options.cacheBackend),
    initProgressCallback: (report: InitProgressReport) => {
      post({
        type: 'PROGRESS',
        progress: report.progress,
        text: report.text,
        timeElapsed: report.timeElapsed,
      });
    },
    logLevel: 'INFO',
  };

  const newEngine = new MLCEngine(engineConfig);
  await newEngine.reload(modelId, {
    context_window_size: contextWindowSize,
    sliding_window_size: -1,
    attention_sink_size: -1,
    temperature: options.temperature ?? DEFAULT_TEMPERATURE,
    top_p: options.topP ?? DEFAULT_TOP_P,
    repetition_penalty: 1.0,
  });

  engine = newEngine;
  currentContextWindow = contextWindowSize;

  let vendor = '';
  try {
    vendor = await newEngine.getGPUVendor();
  } catch {
    vendor = '';
  }

  post({ type: 'READY', modelId, vendor, contextWindowSize });
}

async function handleLoad(options: LLMLoadOptions): Promise<void> {
  try {
    await loadOnce(options);
  } catch (error) {
    const mapped = mapError(error, 'LOAD_FAILED');
    const isMemoryError = mapped.code === 'OOM' || mapped.code === 'DEVICE_LOST';
    const currentWindow = options.contextWindowSize ?? DEFAULT_CONTEXT_WINDOW;

    // Reintento con ventana reducida para dispositivos con poca VRAM.
    if (isMemoryError && currentWindow > 512) {
      post({
        type: 'PROGRESS',
        progress: 0,
        text: 'Memoria insuficiente; reintentando con ventana de contexto reducida…',
        timeElapsed: 0,
      });
      const reduced = Math.max(512, Math.floor(currentWindow / 2));
      await loadOnce({ ...options, contextWindowSize: reduced });
      return;
    }

    post({ type: 'ERROR', code: mapped.code, message: mapped.message });
  }
}

/* ---------------------------- Generación ------------------------------ */

async function handleGenerate(
  id: string,
  messages: LLMChatMessage[],
  options?: LLMGenerateOptions,
): Promise<void> {
  if (!engine) {
    post({ type: 'ERROR', id, code: 'LOAD_FAILED', message: 'El modelo no está cargado todavía.' });
    return;
  }

  activeGenerationId = id;
  let fullText = '';
  let usage: TokenUsage | undefined;
  let finishReason: string | undefined;
  const startedAt = performance.now();
  let decodeStartedAt = 0;
  let emittedDeltas = 0;

  try {
    const chunks = await engine.chat.completions.create({
      messages,
      stream: true,
      stream_options: { include_usage: true },
      max_tokens: options?.maxTokens ?? DEFAULT_MAX_TOKENS,
      temperature: options?.temperature ?? DEFAULT_TEMPERATURE,
      top_p: options?.topP ?? DEFAULT_TOP_P,
      ...(options?.stop && options.stop.length > 0 ? { stop: options.stop } : {}),
    });

    for await (const chunk of chunks) {
      const choice = chunk.choices?.[0];
      const delta = choice?.delta?.content ?? '';
      if (delta) {
        if (decodeStartedAt === 0) decodeStartedAt = performance.now();
        fullText += delta;
        emittedDeltas += 1;
        post({ type: 'TOKEN', id, token: delta });
      }
      if (choice?.finish_reason) finishReason = choice.finish_reason;
      if (chunk.usage) usage = chunk.usage as TokenUsage;
    }

    const elapsedMs = performance.now() - startedAt;
    const decodeMs = decodeStartedAt > 0 ? performance.now() - decodeStartedAt : 0;
    const completionTokens = usage?.completion_tokens ?? emittedDeltas;
    const tokPerSec = decodeMs > 0 ? (completionTokens * 1000) / decodeMs : undefined;

    post({ type: 'COMPLETE', id, fullText, usage, tokPerSec, finishReason, elapsedMs });
  } catch (error) {
    if (abortedIds.has(id)) {
      abortedIds.delete(id);
      post({ type: 'ABORTED', id });
    } else {
      const mapped = mapError(error, 'GENERATION_FAILED');
      post({ type: 'ERROR', id, code: mapped.code, message: mapped.message });
    }
  } finally {
    if (activeGenerationId === id) activeGenerationId = null;
  }
}

/* ------------------------------ Handlers ------------------------------ */

async function handleGpuInfo(id: string): Promise<void> {
  try {
    const vendor = engine ? await engine.getGPUVendor() : '';
    const maxStorageBufferBindingSize = engine ? await engine.getMaxStorageBufferBindingSize() : 0;
    post({ type: 'GPU_INFO', id, vendor, maxStorageBufferBindingSize });
  } catch (error) {
    post({ type: 'ERROR', id, code: 'GENERATION_FAILED', message: String(error) });
  }
}

self.onmessage = (event: MessageEvent<LLMWorkerRequest>) => {
  const message = event.data;
  switch (message.type) {
    case 'LOAD':
      void handleLoad(message.options);
      break;
    case 'GENERATE':
      void handleGenerate(message.id, message.messages, message.options);
      break;
    case 'ABORT': {
      abortedIds.add(message.id ?? activeGenerationId ?? '');
      engine?.interruptGenerate();
      break;
    }
    case 'RESET':
      if (engine) {
        void engine.resetChat().then(() => post({ type: 'RESET_DONE' }));
      } else {
        post({ type: 'RESET_DONE' });
      }
      break;
    case 'UNLOAD':
      if (engine) {
        void engine.unload().then(() => {
          engine = null;
          post({ type: 'UNLOAD_DONE' });
        });
      } else {
        post({ type: 'UNLOAD_DONE' });
      }
      break;
    case 'GPU_INFO':
      void handleGpuInfo(message.id);
      break;
  }
};

// Exportar acceso para tests (nunca usado en runtime del worker real).
export { currentContextWindow as __currentContextWindow };