import { describe, it, expect, vi } from 'vitest';

import {
  CloudLLMClient,
  DEFAULT_CLOUD_MODEL,
  parseChatStream,
  type CloudFetcher,
} from './cloudLLMClient';
import type { CloudMetricsStore, LLMMetricRecord } from './cloudMetrics';
import type { LLMChatMessage, LLMCompletionResult } from './llmTypes';

const messages: LLMChatMessage[] = [
  { role: 'system', content: 'You are a hotel customer.' },
  { role: 'user', content: 'Good evening.' },
];

const encoder = new TextEncoder();

function sseStream(payloads: string[]): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const p of payloads) controller.enqueue(encoder.encode(p));
      controller.close();
    },
  });
}

function fakeResponse(body: ReadableStream<Uint8Array> | null, status = 200): Response {
  return { ok: status >= 200 && status < 300, status, body } as unknown as Response;
}

/** Store espía que captura los registros sin IndexedDB real. */
function makeSpyStore(): { store: CloudMetricsStore; records: LLMMetricRecord[] } {
  const records: LLMMetricRecord[] = [];
  const store = {
    record: vi.fn(async (m: LLMMetricRecord) => {
      records.push(m);
      return records.length;
    }),
    recent: vi.fn(async () => records),
    clear: vi.fn(async () => {
      records.length = 0;
    }),
  } as unknown as CloudMetricsStore;
  return { store, records };
}

const successPayloads = [
  'data: {"choices":[{"delta":{"content":"Good "}}]}\n\n',
  'data: {"choices":[{"delta":{"content":"evening."}}]}\n\n',
  'data: {"choices":[{"finish_reason":"stop"}]}\n\n',
  'data: [DONE]\n\n',
];

describe('CloudLLMClient.generate', () => {
  it('emite onToken por cada delta y onComplete al final (paridad con LocalLLMEngine)', async () => {
    const calls: RequestInit[] = [];
    const fetchFn: CloudFetcher = async (_url, init) => {
      calls.push(init ?? {});
      return fakeResponse(sseStream(successPayloads));
    };

    const { store, records } = makeSpyStore();
    const client = new CloudLLMClient({
      endpoint: 'https://proxy.example/v1/chat/completions',
      fetchFn,
      metrics: store,
      maxRetries: 0,
    });

    const tokens: string[] = [];
    let completed: LLMCompletionResult | undefined;
    const result = await client.generate(messages, {
      onToken: (token) => tokens.push(token),
      onComplete: (r) => {
        completed = r;
      },
    });

    expect(tokens).toEqual(['Good ', 'evening.']);
    expect(result.fullText).toBe('Good evening.');
    expect(result.finishReason).toBe('stop');
    expect(completed?.fullText).toBe('Good evening.');
    expect(result.usage?.completion_tokens).toBe(2);

    // Petición bien formada: modelo + stream SSE, sin credenciales en el cliente.
    const init = calls[0];
    const body = JSON.parse(String(init.body)) as {
      model: string;
      stream: boolean;
      messages: LLMChatMessage[];
    };
    expect(body.model).toBe(DEFAULT_CLOUD_MODEL);
    expect(body.stream).toBe(true);
    expect(body.messages).toEqual(messages);
    const headers = init.headers as Record<string, string>;
    expect(headers['Content-Type']).toBe('application/json');
    expect(headers.Authorization).toBeUndefined();
    expect(headers['x-api-key']).toBeUndefined();

    // Métrica de éxito registrada.
    expect(store.record).toHaveBeenCalled();
    expect(records[0].ok).toBe(true);
    expect(records[0].route).toBe('cloud');
    expect(records[0].completionTokens).toBe(2);
  });
});

describe('CloudLLMClient — degradación por configuración', () => {
  it('rechaza con NO_ENDPOINT si no hay endpoint configurado', async () => {
    const client = new CloudLLMClient({
      endpoint: '',
      fetchFn: async () => {
        throw new Error('no debe llamarse');
      },
      maxRetries: 0,
    });
    await expect(client.generate(messages)).rejects.toMatchObject({ code: 'NO_ENDPOINT' });
    expect(client.isConfigured).toBe(false);
  });
});

describe('CloudLLMClient — manejo de red y reintento', () => {
  it('reintenta ante un fallo de conexión y completa en el segundo intento', async () => {
    let attempts = 0;
    const fetchFn: CloudFetcher = async () => {
      attempts += 1;
      if (attempts === 1) throw new TypeError('Failed to fetch');
      return fakeResponse(sseStream(['data: {"choices":[{"delta":{"content":"ok"}}]}\n\n', 'data: [DONE]\n\n']));
    };
    const client = new CloudLLMClient({
      endpoint: 'https://proxy.example/x',
      fetchFn,
      maxRetries: 1,
      retryBaseDelayMs: 0,
    });
    const result = await client.generate(messages);
    expect(result.fullText).toBe('ok');
    expect(attempts).toBe(2);
  });

  it('devuelve NETWORK retryable si agota los reintentos de conexión', async () => {
    const client = new CloudLLMClient({
      endpoint: 'https://proxy.example/x',
      fetchFn: async () => {
        throw new TypeError('Failed to fetch');
      },
      maxRetries: 0,
    });
    await expect(client.generate(messages)).rejects.toMatchObject({
      code: 'NETWORK',
      retryable: true,
    });
  });

  it('mapea HTTP 5xx a HTTP_ERROR retryable y 4xx a no-retryable', async () => {
    const serverError = new CloudLLMClient({
      endpoint: 'https://proxy.example/x',
      fetchFn: async () => fakeResponse(null, 502),
      maxRetries: 0,
    });
    await expect(serverError.generate(messages)).rejects.toMatchObject({
      code: 'HTTP_ERROR',
      retryable: true,
    });

    const clientError = new CloudLLMClient({
      endpoint: 'https://proxy.example/x',
      fetchFn: async () => fakeResponse(null, 400),
      maxRetries: 0,
    });
    await expect(clientError.generate(messages)).rejects.toMatchObject({
      code: 'HTTP_ERROR',
      retryable: false,
    });
  });

  it('mapea una desconexión a mitad de stream a NETWORK retryable conservando tokens emitidos', async () => {
    let pulls = 0;
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        pulls += 1;
        if (pulls === 1) {
          controller.enqueue(encoder.encode('data: {"choices":[{"delta":{"content":"Hi"}}]}\n\n'));
        } else {
          controller.error(new Error('connection reset'));
        }
      },
    });
    const client = new CloudLLMClient({
      endpoint: 'https://proxy.example/x',
      fetchFn: async () => fakeResponse(stream),
      maxRetries: 0,
    });

    const tokens: string[] = [];
    await expect(
      client.generate(messages, { onToken: (t) => tokens.push(t) }),
    ).rejects.toMatchObject({ code: 'NETWORK', retryable: true });
    expect(tokens).toEqual(['Hi']);
  });

  it('mapea la cancelación (AbortError) a ABORTED y no reintenta', async () => {
    const client = new CloudLLMClient({
      endpoint: 'https://proxy.example/x',
      fetchFn: async () => {
        throw new DOMException('aborted', 'AbortError');
      },
      maxRetries: 1,
      retryBaseDelayMs: 0,
    });
    await expect(client.generate(messages)).rejects.toMatchObject({ code: 'ABORTED' });
  });

  it('registra métrica de fallo con código de error', async () => {
    const { store, records } = makeSpyStore();
    const client = new CloudLLMClient({
      endpoint: 'https://proxy.example/x',
      fetchFn: async () => {
        throw new TypeError('Failed to fetch');
      },
      metrics: store,
      maxRetries: 0,
    });
    await expect(client.generate(messages)).rejects.toMatchObject({ code: 'NETWORK' });
    expect(records[0].ok).toBe(false);
    expect(records[0].errorCode).toBe('NETWORK');
    expect(records[0].elapsedMs).toBeGreaterThanOrEqual(0);
  });
});

describe('parseChatStream', () => {
  it('acepta NDJSON (una línea = un JSON)', async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode('{"choices":[{"delta":{"content":"a"}}]}\n'));
        controller.enqueue(encoder.encode('{"choices":[{"delta":{"content":"b"}}]}\n'));
        controller.close();
      },
    });
    const out = await parseChatStream(stream);
    expect(out.fullText).toBe('ab');
    expect(out.completionTokens).toBe(2);
  });

  it('ignora keepalives, comentarios y líneas no-JSON', async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode(': keep-alive\n\n'));
        controller.enqueue(encoder.encode('data: {"choices":[{"delta":{"content":"ok"}}]}\n\n'));
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      },
    });
    const out = await parseChatStream(stream);
    expect(out.fullText).toBe('ok');
  });

  it('captura usage si el servidor lo incluye', async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(
          encoder.encode(
            'data: {"choices":[{"delta":{"content":"x"}}],"usage":{"prompt_tokens":5,"completion_tokens":1,"total_tokens":6}}\n\n',
          ),
        );
        controller.close();
      },
    });
    const out = await parseChatStream(stream);
    expect(out.usage?.prompt_tokens).toBe(5);
    expect(out.usage?.completion_tokens).toBe(1);
  });
});