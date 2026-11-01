/**
 * Cliente de inferencia cloud con streaming (FC-08).
 *
 * Fallback para dispositivos sin WebGPU o con memoria insuficiente para el motor
 * local (FC-07). Habla con un endpoint **proxy** OpenAI-compatible
 * (`POST /v1/chat/completions` con `stream: true`, respuesta SSE) servido por
 * Cloudflare Workers AI o un proxy Gemini. La API key reside SIEMPRE en el
 * servidor proxy; este cliente no incluye credenciales en el navegador.
 *
 * Contrato de paridad con `LocalLLMEngine.generate(messages, callbacks, options)`:
 * el router híbrido (hybridEngine) y FC-03 no distinguen la ruta.
 *
 * Manejo de desconexión:
 *  - Fallo de conexión/HTTP ANTES de emitir el primer token → reintento con
 *    backoff exponencial acotado por `maxRetries`.
 *  - Si `navigator.onLine === false` (offline real), no se reintenta: se degrada
 *    con `NETWORK` y mensaje claro.
 *  - Corte a mitad de stream → `NETWORK` con `retryable: true`.
 */

import type { GenerateCallbacks } from './localEngine';
import { estimateTokens } from './contextWindow';
import { DEFAULT_MAX_TOKENS } from './llmTypes';
import type {
  LLMChatMessage,
  LLMCompletionResult,
  LLMError,
  LLMErrorCode,
  LLMGenerateOptions,
  TokenUsage,
} from './llmTypes';
import type { CloudMetricsStore, LLMMetricRoute } from './cloudMetrics';

/** Modelo remoto por defecto (Workers AI, ~3B, cheap para turnos cortos). */
export const DEFAULT_CLOUD_MODEL = '@cf/meta/llama-3.2-3b-instruct';

/** Firma fetch inyectable (permite mockear en tests). */
export type CloudFetcher = (input: string | URL, init?: RequestInit) => Promise<Response>;

export interface CloudLLMClientConfig {
  /** Endpoint del proxy OpenAI-compatible `/chat/completions`. */
  endpoint?: string;
  /** Modelo remoto a solicitar. Por defecto `DEFAULT_CLOUD_MODEL`. */
  model?: string;
  /** Firma fetch inyectable. Por defecto `globalThis.fetch`. */
  fetchFn?: CloudFetcher;
  /** Almacén de métricas (IndexedDB). Por defecto el store compartido. */
  metrics?: CloudMetricsStore;
  /** Métrica de ruta; por defecto 'cloud'. */
  metricRoute?: LLMMetricRoute;
  /** Intentos extra ANTES de emitir el primer token (0 = sin reintento). */
  maxRetries?: number;
  /** Retardo base (ms) del backoff exponencial. */
  retryBaseDelayMs?: number;
  /** Timeout de la petición (ms) tras el cual se aborta. */
  timeoutMs?: number;
  /** Cabeceras extra. NUNCA se usa para API keys hardcodeadas. */
  headers?: Record<string, string>;
  /** Solicitar `usage` al servidor vía `stream_options.include_usage`. */
  includeUsage?: boolean;
}

/** Resultado interno del parseo del stream SSE. */
export interface ParsedStream {
  fullText: string;
  /** Uso reportado por el servidor (chunk final `include_usage`), si lo hubo. */
  usage?: TokenUsage;
  finishReason?: string;
  /** Número de deltas de contenido emitidos (proxy de completion_tokens). */
  completionTokens: number;
}

interface CloudChatRequest {
  model: string;
  messages: LLMChatMessage[];
  stream: true;
  max_tokens: number;
  temperature?: number;
  top_p?: number;
  stop?: string[];
  stream_options?: { include_usage: true };
}

interface CloudChatChunk {
  choices?: Array<{
    delta?: { content?: string | null };
    finish_reason?: string | null;
  }>;
  usage?: TokenUsage;
}

const MESSAGE_OVERHEAD_TOKENS = 4;

/* ------------------------------ utilidades ------------------------------ */

let idCounter = 0;

function generateId(): string {
  idCounter += 1;
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${idCounter}`;
}

function nowMs(): number {
  return Date.now();
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isAbortError(error: unknown): boolean {
  // No usar `instanceof Error`: un DOMException de otro realm (jsdom, worker)
  // puede no pertenecer a la cadena de prototipos de Error del módulo.
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { name?: unknown }).name === 'AbortError'
  );
}

function isBrowserOffline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}

function makeError(
  id: string,
  code: LLMErrorCode,
  message: string,
  retryable?: boolean,
): LLMError {
  const error: LLMError = { id, code, message };
  if (retryable !== undefined) error.retryable = retryable;
  return error;
}

/** Lee el endpoint desde `VITE_LLM_PROXY_URL` (compilado por Vite, nunca en el bundle). */
function endpointFromEnv(): string {
  const meta = import.meta as unknown as { env?: Record<string, string | undefined> };
  const value = meta.env?.VITE_LLM_PROXY_URL;
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * Constructor del body del prompt: estima tokens de entrada sin tokenizador,
 * reutilizando la heurística conservadora de `contextWindow.ts`.
 */
function estimatePromptTokens(messages: LLMChatMessage[]): number {
  return messages.reduce(
    (sum, m) => sum + estimateTokens(m.content) + MESSAGE_OVERHEAD_TOKENS,
    0,
  );
}

/* ---------------------------- parseo del stream ---------------------------- */

/** Parsea un body SSE (o NDJSON) en tokens de contenido, tolerando keepalives. */
export async function parseChatStream(
  stream: ReadableStream<Uint8Array>,
  onDelta?: (delta: string, partial: string) => void,
): Promise<ParsedStream> {
  const reader = stream.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let fullText = '';
  let usage: TokenUsage | undefined;
  let finishReason: string | undefined;
  let completionTokens = 0;

  const handleLine = (rawLine: string): void => {
    const trimmed = rawLine.trimEnd();
    let payload: string | null = null;
    if (trimmed.startsWith('data:')) {
      payload = trimmed.slice(5).trimStart();
    } else if (trimmed.startsWith('{')) {
      payload = trimmed; // NDJSON (una línea = un JSON)
    }
    if (payload === null || payload === '' || payload === '[DONE]') return;

    let chunk: CloudChatChunk;
    try {
      chunk = JSON.parse(payload) as CloudChatChunk;
    } catch {
      return; // líneas no-JSON (comentarios, keepalive)
    }

    const delta = chunk.choices?.[0]?.delta?.content ?? '';
    if (delta) {
      fullText += delta;
      completionTokens += 1;
      onDelta?.(delta, fullText);
    }
    if (chunk.choices?.[0]?.finish_reason) {
      finishReason = chunk.choices[0].finish_reason;
    }
    if (chunk.usage) usage = chunk.usage;
  };

  /* eslint-disable-next-line no-constant-condition */
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let nl = buffer.indexOf('\n');
    while (nl !== -1) {
      const line = buffer.slice(0, nl);
      buffer = buffer.slice(nl + 1);
      handleLine(line);
      nl = buffer.indexOf('\n');
    }
  }

  buffer += decoder.decode();
  if (buffer.length > 0) handleLine(buffer);

  return { fullText, usage, finishReason, completionTokens };
}

/* ------------------------------ cliente cloud ------------------------------ */

export class CloudLLMClient {
  private readonly endpoint: string;
  private readonly model: string;
  private readonly fetchFn: CloudFetcher;
  private readonly metrics: CloudMetricsStore | undefined;
  private readonly metricRoute: LLMMetricRoute;
  private readonly maxRetries: number;
  private readonly retryBaseDelayMs: number;
  private readonly timeoutMs: number;
  private readonly headers: Record<string, string>;
  private readonly includeUsage: boolean;
  private activeAbort: AbortController | null = null;

  constructor(config: CloudLLMClientConfig = {}) {
    this.endpoint = config.endpoint ?? endpointFromEnv();
    this.model = config.model ?? DEFAULT_CLOUD_MODEL;
    this.fetchFn =
      config.fetchFn ??
      ((input: string | URL, init?: RequestInit) => fetch(input, init));
    this.metrics = config.metrics;
    this.metricRoute = config.metricRoute ?? 'cloud';
    this.maxRetries = config.maxRetries ?? 2;
    this.retryBaseDelayMs = config.retryBaseDelayMs ?? 500;
    this.timeoutMs = config.timeoutMs ?? 30_000;
    this.headers = config.headers ?? {};
    this.includeUsage = config.includeUsage ?? false;
  }

  /** `true` si hay endpoint configurado. `false` ⇒ la ruta degrada a NO_ENDPOINT. */
  get isConfigured(): boolean {
    return this.endpoint.length > 0;
  }

  /** Nombre del modelo remoto usado por este cliente. */
  get modelId(): string {
    return this.model;
  }

  /** Cancela la generación en curso (interrumpe el fetch). */
  abort(): void {
    this.activeAbort?.abort();
  }

  /**
   * Genera una respuesta con streaming token a token, con la MISMA firma que
   * `LocalLLMEngine.generate`. Reintenta ante fallo de conexión (solo si aún no
   * se emitió ningún token) y registra latencia/uso en IndexedDB.
   */
  async generate(
    messages: LLMChatMessage[],
    callbacks: GenerateCallbacks = {},
    options: LLMGenerateOptions = {},
    scenarioKey?: string,
  ): Promise<LLMCompletionResult> {
    const id = generateId();
    const startedAt = nowMs();
    const promptTokens = estimatePromptTokens(messages);
    let firstTokenAt = 0;
    let partial = '';

    if (!this.isConfigured) {
      const err = makeError(
        id,
        'NO_ENDPOINT',
        'Fallback cloud no configurado: falta VITE_LLM_PROXY_URL en el proxy de IA.',
      );
      await this.safeRecord(startedAt, {
        model: this.model,
        scenarioKey,
        promptTokens,
        elapsedMs: nowMs() - startedAt,
        ok: false,
        errorCode: err.code,
      });
      callbacks.onError?.(err);
      throw err;
    }

    let error: LLMError | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const outcome = await this.streamOnce(id, messages, options, (delta) => {
          if (firstTokenAt === 0) firstTokenAt = nowMs();
          partial += delta;
          callbacks.onToken?.(delta, partial);
        });

        const elapsedMs = nowMs() - startedAt;
        const firstTokenMs = firstTokenAt > 0 ? firstTokenAt - startedAt : undefined;
        const decodeMs = firstTokenAt > 0 ? nowMs() - firstTokenAt : 0;
        const completionTokens = outcome.usage?.completion_tokens ?? outcome.completionTokens;
        const usage: TokenUsage =
          outcome.usage ??
          {
            prompt_tokens: promptTokens,
            completion_tokens: completionTokens,
            total_tokens: promptTokens + completionTokens,
          };

        const result: LLMCompletionResult = {
          id,
          fullText: outcome.fullText,
          usage,
          tokPerSec: decodeMs > 0 ? Math.round((completionTokens * 1000) / decodeMs) : undefined,
          finishReason: outcome.finishReason,
          elapsedMs,
        };

        await this.safeRecord(startedAt, {
          model: this.model,
          scenarioKey,
          promptTokens,
          completionTokens,
          firstTokenMs,
          elapsedMs,
          ok: true,
        });

        callbacks.onComplete?.(result);
        return result;
      } catch (caught) {
        const current = (caught as LLMError) ?? { id, code: 'UNKNOWN', message: String(caught) };
        error = current;

        // Cancelado por el usuario: no reintentar.
        if (current.code === 'ABORTED') break;
        // Offline real: reintentar no sirve, degradar de inmediato.
        if (isBrowserOffline()) break;

        const retryable =
          current.retryable ?? (current.code === 'NETWORK' || current.code === 'HTTP_ERROR');

        // Solo reintentamos si aún no se ha emitido ningún token (evita duplicados).
        if (attempt < this.maxRetries && firstTokenAt === 0 && retryable) {
          await delay(this.retryBaseDelayMs * 2 ** attempt);
          continue;
        }
        break;
      }
    }

    const finalError =
      error ?? makeError(id, 'UNKNOWN', 'Fallo desconocido en el cliente cloud.');

    await this.safeRecord(startedAt, {
      model: this.model,
      scenarioKey,
      promptTokens,
      completionTokens: undefined,
      firstTokenMs: firstTokenAt > 0 ? firstTokenAt - startedAt : undefined,
      elapsedMs: nowMs() - startedAt,
      ok: false,
      errorCode: finalError.code,
    });

    callbacks.onError?.(finalError);
    throw finalError;
  }

  private async streamOnce(
    id: string,
    messages: LLMChatMessage[],
    options: LLMGenerateOptions,
    onDelta: (delta: string, partial: string) => void,
  ): Promise<ParsedStream> {
    const controller = new AbortController();
    this.activeAbort = controller;
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    const body: CloudChatRequest = {
      model: this.model,
      messages,
      stream: true,
      max_tokens: options.maxTokens ?? DEFAULT_MAX_TOKENS,
      ...(options.temperature !== undefined ? { temperature: options.temperature } : {}),
      ...(options.topP !== undefined ? { top_p: options.topP } : {}),
      ...(options.stop && options.stop.length > 0 ? { stop: options.stop } : {}),
      ...(this.includeUsage ? { stream_options: { include_usage: true } } : {}),
    };

    let response: Response;
    try {
      response = await this.fetchFn(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
          ...this.headers,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (caught) {
      clearTimeout(timeoutId);
      this.activeAbort = null;
      if (isAbortError(caught)) {
        throw makeError(id, 'ABORTED', 'Generación cancelada.');
      }
      throw makeError(
        id,
        'NETWORK',
        'No se pudo conectar con el servicio de IA. Comprueba tu conexión.',
        true,
      );
    }

    if (!response.ok) {
      clearTimeout(timeoutId);
      this.activeAbort = null;
      const retryable = response.status === 429 || response.status >= 500;
      throw makeError(id, 'HTTP_ERROR', `El servicio de IA respondió HTTP ${response.status}.`, retryable);
    }

    if (!response.body) {
      clearTimeout(timeoutId);
      this.activeAbort = null;
      throw makeError(id, 'INVALID_RESPONSE', 'El servicio devolvió una respuesta sin cuerpo.');
    }

    try {
      return await parseChatStream(response.body, onDelta);
    } catch (caught) {
      clearTimeout(timeoutId);
      this.activeAbort = null;
      if (isAbortError(caught)) {
        throw makeError(id, 'ABORTED', 'Generación cancelada.');
      }
      throw makeError(
        id,
        'NETWORK',
        'Se perdió la conexión durante la respuesta. Vuelve a intentarlo.',
        true,
      );
    } finally {
      clearTimeout(timeoutId);
      this.activeAbort = null;
    }
  }

  private async safeRecord(
    startedAt: number,
    metric: {
      model: string;
      scenarioKey?: string;
      promptTokens?: number;
      completionTokens?: number;
      firstTokenMs?: number;
      elapsedMs: number;
      ok: boolean;
      errorCode?: string;
    },
  ): Promise<void> {
    if (!this.metrics) return;
    await this.metrics.record({
      ts: startedAt,
      route: this.metricRoute,
      model: metric.model,
      scenarioKey: metric.scenarioKey,
      promptTokens: metric.promptTokens,
      completionTokens: metric.completionTokens,
      firstTokenMs: metric.firstTokenMs,
      elapsedMs: metric.elapsedMs,
      ok: metric.ok,
      errorCode: metric.errorCode,
    });
  }
}

/** Instancia única compartida del cliente cloud. */
let defaultClient: CloudLLMClient | null = null;

export function getCloudLLMClient(config?: CloudLLMClientConfig): CloudLLMClient {
  if (!defaultClient) {
    defaultClient = new CloudLLMClient(config);
  }
  return defaultClient;
}