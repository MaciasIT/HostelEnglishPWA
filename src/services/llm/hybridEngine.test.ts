import { describe, it, expect, vi } from 'vitest';

import { HybridLLMEngine } from './hybridEngine';
import type { CloudLLMClientLike, LocalLLMClientLike } from './hybridEngine';
import type { LLMCapability, LLMChatMessage, LLMCompletionResult } from './llmTypes';

const messages: LLMChatMessage[] = [
  { role: 'system', content: 'You are a hotel customer.' },
  { role: 'user', content: 'Good evening.' },
];

const supportedCap: LLMCapability = {
  webgpu: true,
  worker: true,
  deviceMemoryGb: 8,
  supported: true,
};

const unsupportedCap: LLMCapability = {
  webgpu: false,
  worker: true,
  supported: false,
  reason: 'WebGPU no soportado o adaptador no disponible.',
};

function completion(text: string): LLMCompletionResult {
  return { id: 'id-1', fullText: text, elapsedMs: 10 };
}

function makeLocal(behavior: 'success' | 'oom'): LocalLLMClientLike {
  const generate = vi.fn();
  if (behavior === 'success') {
    generate.mockResolvedValue(completion('local reply'));
  } else {
    generate.mockRejectedValue({ code: 'OOM', message: 'out of memory' });
  }
  return {
    load: vi.fn(async () => undefined),
    generate,
    abort: vi.fn(),
    dispose: vi.fn(),
  } as unknown as LocalLLMClientLike;
}

function makeCloud(): CloudLLMClientLike {
  return {
    // Simula el cliente real: invoca los callbacks que le fueron reenviados.
    generate: vi.fn(async (_m: LLMChatMessage[], callbacks?: { onComplete?: (r: LLMCompletionResult) => void }) => {
      const r = completion('cloud reply');
      callbacks?.onComplete?.(r);
      return r;
    }),
    abort: vi.fn(),
  } as unknown as CloudLLMClientLike;
}

describe('HybridLLMEngine — switch transparente', () => {
  it('enruta directo a cloud cuando el dispositivo no soporta WebGPU', async () => {
    const local = makeLocal('success');
    const cloud = makeCloud();
    const engine = new HybridLLMEngine({
      local,
      cloud,
      getCapability: async () => unsupportedCap,
    });

    const result = await engine.generate(messages);
    expect(result.fullText).toBe('cloud reply');
    expect(local.generate).not.toHaveBeenCalled();
    expect(cloud.generate).toHaveBeenCalled();
    expect(engine.usingCloud).toBe(true);
  });

  it('usa el motor local cuando está soportado', async () => {
    const local = makeLocal('success');
    const cloud = makeCloud();
    const engine = new HybridLLMEngine({
      local,
      cloud,
      getCapability: async () => supportedCap,
    });

    const result = await engine.generate(messages);
    expect(result.fullText).toBe('local reply');
    expect(local.generate).toHaveBeenCalled();
    expect(cloud.generate).not.toHaveBeenCalled();
    expect(engine.usingCloud).toBe(false);
  });

  it('cae transparentemente a cloud si la generación local lanza OOM (sin cambios de UI)', async () => {
    const local = makeLocal('oom');
    const cloud = makeCloud();
    const engine = new HybridLLMEngine({
      local,
      cloud,
      getCapability: async () => supportedCap,
    });

    const tokens: string[] = [];
    let completed = '';
    const result = await engine.generate(messages, {
      onToken: (t) => tokens.push(t),
      onComplete: (r) => {
        completed = r.fullText;
      },
    });

    expect(result.fullText).toBe('cloud reply');
    expect(local.generate).toHaveBeenCalledTimes(1);
    expect(cloud.generate).toHaveBeenCalledTimes(1);
    expect(completed).toBe('cloud reply');
    expect(engine.usingCloud).toBe(true);
    expect(result.fullText).toBe('cloud reply');

    // Tras la caída, los turnos siguientes evitan reintentar local.
    await engine.generate(messages);
    expect(local.generate).toHaveBeenCalledTimes(1);
    expect(cloud.generate).toHaveBeenCalledTimes(2);
  });

  it('propaga errores locales que NO son de fallback', async () => {
    const local = {
      load: vi.fn(),
      generate: vi.fn(async () => {
        throw { code: 'GENERATION_FAILED', message: 'x' };
      }),
      abort: vi.fn(),
      dispose: vi.fn(),
    } as unknown as LocalLLMClientLike;
    const cloud = makeCloud();
    const engine = new HybridLLMEngine({
      local,
      cloud,
      getCapability: async () => supportedCap,
    });

    await expect(engine.generate(messages)).rejects.toMatchObject({ code: 'GENERATION_FAILED' });
    expect(cloud.generate).not.toHaveBeenCalled();
  });
});

describe('HybridLLMEngine — prepare', () => {
  it('no carga local si no está soportado', async () => {
    const local = makeLocal('success');
    const engine = new HybridLLMEngine({
      local,
      getCapability: async () => unsupportedCap,
    });

    const cap = await engine.prepare();
    expect(cap.supported).toBe(false);
    expect(local.load).not.toHaveBeenCalled();
    expect(engine.usingCloud).toBe(true);
  });

  it('carga local y conmuta a cloud si la carga falla con OOM', async () => {
    const local = {
      load: vi.fn(async () => {
        throw { code: 'OOM', message: 'out of memory' };
      }),
      generate: vi.fn(),
      abort: vi.fn(),
      dispose: vi.fn(),
    } as unknown as LocalLLMClientLike;
    const engine = new HybridLLMEngine({
      local,
      getCapability: async () => supportedCap,
    });

    await engine.prepare();
    expect(local.load).toHaveBeenCalled();
    expect(engine.usingCloud).toBe(true);
  });

  it('propaga errores de carga que no son de fallback', async () => {
    const local = {
      load: vi.fn(async () => {
        throw { code: 'LOAD_FAILED', message: 'corrupt' };
      }),
      generate: vi.fn(),
      abort: vi.fn(),
      dispose: vi.fn(),
    } as unknown as LocalLLMClientLike;
    const engine = new HybridLLMEngine({
      local,
      getCapability: async () => supportedCap,
    });

    await expect(engine.prepare()).rejects.toMatchObject({ code: 'LOAD_FAILED' });
    expect(engine.usingCloud).toBe(false);
  });
});