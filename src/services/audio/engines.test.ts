import { describe, it, expect, vi } from 'vitest';

import { playAudio } from '@/utils/audio';

import { CloudEngine, PiperEngine, WebSpeechEngine } from './engines';
import type { CloudFetcher } from './engines';
import type { DeviceCapabilities } from './types';

vi.mock('@/utils/audio', () => ({
  playAudio: vi.fn().mockResolvedValue(undefined),
}));

const baseCaps: DeviceCapabilities = {
  webgpu: true,
  webAudio: true,
  speechSynthesis: true,
  secureContext: true,
  deviceMemoryGB: 8,
  hardwareConcurrency: 8,
  online: true,
};

describe('PiperEngine', () => {
  it('está disponible solo con WebGPU y Web Audio', async () => {
    const engine = new PiperEngine();
    expect(await engine.isAvailable(baseCaps)).toBe(true);
    expect(await engine.isAvailable({ ...baseCaps, webgpu: false })).toBe(false);
    expect(await engine.isAvailable({ ...baseCaps, webAudio: false })).toBe(false);
  });

  it('lanza en speak (aún no integrado) para forzar la degradación', async () => {
    const engine = new PiperEngine();
    await expect(engine.speak('hola', {})).rejects.toThrow(/PiperEngine/);
  });

  it('permite inyectar la síntesis para tests de cascada', async () => {
    const synth = vi.fn().mockResolvedValue(undefined);
    const engine = new PiperEngine(synth);
    await engine.speak('hola', { language: 'es' });
    expect(synth).toHaveBeenCalledWith('hola', { language: 'es' });
  });
});

describe('CloudEngine', () => {
  it('está disponible solo con red y endpoint', async () => {
    expect(await new CloudEngine({}).isAvailable(baseCaps)).toBe(false);
    expect(await new CloudEngine({ endpoint: 'https://x' }).isAvailable(baseCaps)).toBe(true);
    expect(await new CloudEngine({ endpoint: 'https://x' }).isAvailable({ ...baseCaps, online: false })).toBe(false);
  });

  it('lanza si no hay endpoint configurado', async () => {
    await expect(new CloudEngine({}).speak('hi', {})).rejects.toThrow(/endpoint/);
  });

  it('lanza si el streaming responde con error', async () => {
    const fetchFn = vi.fn().mockResolvedValue({ ok: false, status: 500 } as Response);
    const engine = new CloudEngine({ endpoint: 'https://x', fetchFn: fetchFn as CloudFetcher });
    await expect(engine.speak('hi', {})).rejects.toThrow(/500/);
    expect(fetchFn).toHaveBeenCalledWith(
      'https://x',
      expect.objectContaining({ method: 'POST' }),
    );
  });
});

describe('WebSpeechEngine', () => {
  it('está disponible si hay síntesis de voz', async () => {
    const engine = new WebSpeechEngine();
    expect(await engine.isAvailable({ ...baseCaps, speechSynthesis: true })).toBe(true);
    expect(await engine.isAvailable({ ...baseCaps, speechSynthesis: false })).toBe(false);
  });

  it('delega en playAudio con las opciones normalizadas', async () => {
    vi.mocked(playAudio).mockClear();
    const engine = new WebSpeechEngine();
    await engine.speak('hello', { language: 'en', rate: 0.9, pitch: 1.1, voiceURI: 'v1' });
    expect(playAudio).toHaveBeenCalledWith('hello', 'en', { rate: 0.9, pitch: 1.1, voiceURI: 'v1' });
  });
});