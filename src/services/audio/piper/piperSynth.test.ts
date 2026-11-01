import { describe, it, expect, vi } from 'vitest';

import { PIPER_VOICES } from './piperVoices';
import { createPiperSynth } from './piperSynth';
import type { PiperRuntimeLike } from './piperSynth';

function fakeRuntime() {
  return {
    ensureSession: vi.fn(async () => ({ fake: true })),
    phonemize: vi.fn(async () => [1, 14, 2]),
    synthesize: vi.fn(async () => new Float32Array([0, 0.1, -0.1, 0])),
  } satisfies PiperRuntimeLike;
}

describe('createPiperSynth — orquestación de síntesis (FC-09)', () => {
  it('sintetiza euskera con la voz por defecto (Antton), en orden y con parámetros correctos', async () => {
    const runtime = fakeRuntime();
    const play = vi.fn(async () => {});
    const synth = createPiperSynth(runtime, play);

    await synth('kaixo', { language: 'eu' });

    expect(runtime.ensureSession).toHaveBeenCalledWith(PIPER_VOICES['eu_ES-antton-medium']);
    expect(runtime.phonemize).toHaveBeenCalledWith('kaixo', 'eu');
    expect(runtime.synthesize).toHaveBeenCalledWith(
      { fake: true },
      [1, 14, 2],
      { noiseScale: 0.667, lengthScale: 1.0, noiseW: 0.8 },
    );
    expect(play).toHaveBeenCalledWith(expect.any(Float32Array), 22050, 1);
  });

  it('usa la voz explícita (Maider) cuando se solicita', async () => {
    const runtime = fakeRuntime();
    const synth = createPiperSynth(runtime, vi.fn());

    await synth('kaixo', { language: 'eu', voice: 'maider' });

    expect(runtime.ensureSession).toHaveBeenCalledWith(PIPER_VOICES['eu_ES-maider-medium']);
  });

  it('respeta la velocidad (rate) en la reproducción', async () => {
    const runtime = fakeRuntime();
    const play = vi.fn(async () => {});
    const synth = createPiperSynth(runtime, play);

    await synth('kaixo', { language: 'eu', rate: 0.8 });

    expect(play).toHaveBeenCalledWith(expect.any(Float32Array), 22050, 0.8);
  });

  it('lanza (degrada) para idiomas sin voz Piper nativa', async () => {
    const synth = createPiperSynth(fakeRuntime(), vi.fn());

    await expect(synth('hello', { language: 'en' })).rejects.toThrow(/sin voz Piper nativa/);
    await expect(synth('hola', { language: 'es' })).rejects.toThrow(/sin voz Piper nativa/);
  });
});