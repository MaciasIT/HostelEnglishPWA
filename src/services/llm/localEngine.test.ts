import { describe, it, expect, afterEach } from 'vitest';
import { LocalLLMEngine } from './localEngine';
import type { LLMWorkerRequest, LLMWorkerResponse } from '@/workers/llm.worker';
import type { LLMChatMessage } from './llmTypes';

/** Fake de Worker que captura `postMessage` y permite emitir respuestas. */
class FakeWorker {
  onmessage: ((event: MessageEvent<unknown>) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  posted: LLMWorkerRequest[] = [];

  postMessage(data: LLMWorkerRequest): void {
    this.posted.push(data);
  }

  terminate(): void {
    /* noop */
  }

  emit(response: LLMWorkerResponse): void {
    this.onmessage?.({ data: response } as MessageEvent<unknown>);
  }
}

class TestEngine extends LocalLLMEngine {
  fakeWorker = new FakeWorker();

  protected createWorker(): Worker {
    return this.fakeWorker as unknown as Worker;
  }
}

const messages: LLMChatMessage[] = [
  { role: 'system', content: 'You are a hotel customer.' },
  { role: 'user', content: 'Good evening.' },
];

afterEach(() => {
  // Evitar interferencias entre tests.
});

describe('LocalLLMEngine.generate', () => {
  it('publica GENERATE al worker con los mensajes recortados', async () => {
    const engine = new TestEngine();
    const sentMessages: LLMChatMessage[][] = [];

    const resultPromise = engine.generate(messages, {}, {});

    const posted = engine.fakeWorker.posted.find((p) => p.type === 'GENERATE');
    expect(posted).toBeTruthy();
    if (posted && posted.type === 'GENERATE') {
      sentMessages.push(posted.messages);
    }

    // Simular streaming token a token y fin.
    const id = posted && posted.type === 'GENERATE' ? posted.id : '';
    engine.fakeWorker.emit({ type: 'TOKEN', id, token: 'Good ' });
    engine.fakeWorker.emit({ type: 'TOKEN', id, token: 'evening.' });
    engine.fakeWorker.emit({
      type: 'COMPLETE',
      id,
      fullText: 'Good evening.',
      usage: { prompt_tokens: 20, completion_tokens: 3, total_tokens: 23 },
      tokPerSec: 35,
      finishReason: 'stop',
      elapsedMs: 80,
    });

    const result = await resultPromise;
    expect(result.fullText).toBe('Good evening.');
    expect(result.tokPerSec).toBe(35);

    // El system debe conservarse en lo publicado.
    expect(sentMessages[0][0].role).toBe('system');
  });

  it('emite onToken por cada delta y onComplete al final', async () => {
    const engine = new TestEngine();
    const tokens: string[] = [];
    let completed = false;

    const promise = engine.generate(
      messages,
      {
        onToken: (token) => tokens.push(token),
        onComplete: () => {
          completed = true;
        },
      },
      {},
    );

    const posted = engine.fakeWorker.posted.find((p) => p.type === 'GENERATE');
    const id = posted && posted.type === 'GENERATE' ? posted.id : '';
    engine.fakeWorker.emit({ type: 'TOKEN', id, token: 'Hi' });
    engine.fakeWorker.emit({ type: 'TOKEN', id, token: ' there' });
    engine.fakeWorker.emit({ type: 'COMPLETE', id, fullText: 'Hi there', elapsedMs: 10 });

    await promise;
    expect(tokens).toEqual(['Hi', ' there']);
    expect(completed).toBe(true);
  });

  it('rechaza con onError ante un ERROR del worker', async () => {
    const engine = new TestEngine();
    let errorCode: string | undefined;

    const promise = engine.generate(
      messages,
      { onError: (err) => { errorCode = err.code; } },
      {},
    );

    const posted = engine.fakeWorker.posted.find((p) => p.type === 'GENERATE');
    const id = posted && posted.type === 'GENERATE' ? posted.id : '';
    engine.fakeWorker.emit({ type: 'ERROR', id, code: 'DEVICE_LOST', message: 'device lost' });

    await expect(promise).rejects.toMatchObject({ code: 'DEVICE_LOST' });
    expect(errorCode).toBe('DEVICE_LOST');
  });

  it('resuelve load a ready al recibir READY del worker', async () => {
    const engine = new TestEngine();
    const progressTexts: string[] = [];

    const loadPromise = engine.load((p) => progressTexts.push(p.text));
    expect(engine.fakeWorker.posted.some((p) => p.type === 'LOAD')).toBe(true);

    engine.fakeWorker.emit({ type: 'PROGRESS', progress: 0.5, text: 'Downloading…', timeElapsed: 2 });
    engine.fakeWorker.emit({ type: 'READY', modelId: 'Llama-3.2-1B-Instruct-q4f16_1-MLC', vendor: 'nvidia', contextWindowSize: 1024 });

    await loadPromise;
    expect(engine.engineState).toBe('ready');
    expect(progressTexts).toContain('Downloading…');
  });

  it('rechaza load si el worker responde ERROR durante la carga', async () => {
    const engine = new TestEngine();
    const loadPromise = engine.load();
    engine.fakeWorker.emit({ type: 'ERROR', code: 'OOM', message: 'out of memory' });
    await expect(loadPromise).rejects.toMatchObject({ code: 'OOM' });
    expect(engine.engineState).toBe('error');
  });
});