import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  saveSample, getSample, listSamples, deleteSample, clearSamples, playSample, sampleToBlob,
  sampleFileName, VoicePortfolioError, MAX_SAMPLE_BYTES,
} from './voicePortfolio';

const blob = (n = 1000, type = 'audio/webm') => new Blob([new Uint8Array(n).fill(7)], { type });

describe('voicePortfolio (IndexedDB)', () => {
  beforeEach(async () => { await clearSamples(); });

  it('guarda y lee una muestra', async () => {
    await saveSample(0, blob(), 12.5);
    const s = await getSample(0);
    expect(s?.mimeType).toBe('audio/webm');
    expect(s?.durationSeconds).toBe(12.5);
    expect(s?.buffer.byteLength).toBe(1000);
    expect(sampleToBlob(s!).size).toBe(1000);
  });

  it('lista ordenado y regrabar sobrescribe', async () => {
    await saveSample(2, blob(10), 1);
    await saveSample(0, blob(20, 'audio/ogg'), 2);
    await saveSample(0, blob(30), 3);
    const list = await listSamples();
    expect(list.map((s) => s.slot)).toEqual([0, 2]);
    expect(list[0].sizeBytes).toBe(30);
  });

  it('borra una muestra', async () => {
    await saveSample(1, blob(), 5);
    await deleteSample(1);
    expect(await getSample(1)).toBeUndefined();
  });

  it.each([
    ['hueco inválido', () => saveSample(3, blob(), 5), 'INVALID_SLOT'],
    ['MIME inválido', () => saveSample(0, blob(10, 'audio/mp3'), 5), 'INVALID_MIME'],
    ['más de 30 s', () => saveSample(0, blob(), 30.5), 'TOO_LONG'],
    ['más de 200 KB', () => saveSample(0, blob(MAX_SAMPLE_BYTES + 1), 5), 'TOO_LARGE'],
    ['vacía', () => saveSample(0, blob(0), 5), 'EMPTY'],
  ])('rechaza %s', async (_n, fn, code) => {
    await expect(fn()).rejects.toMatchObject({ code });
    await expect(fn()).rejects.toBeInstanceOf(VoicePortfolioError);
  });

  it('reproduce localmente y libera la URL', async () => {
    const s = await saveSample(0, blob(), 5);
    const play = vi.fn().mockResolvedValue(undefined);
    const pause = vi.fn();
    const origAudio = globalThis.Audio;
    globalThis.Audio = class { play = play; pause = pause; addEventListener() {} } as unknown as typeof Audio;
    URL.createObjectURL = vi.fn(() => 'blob:x');
    URL.revokeObjectURL = vi.fn();
    const { dispose } = playSample(s);
    expect(play).toHaveBeenCalled();
    dispose();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:x');
    globalThis.Audio = origAudio;
  });

  it('nombre de fichero según formato', async () => {
    expect(sampleFileName(await saveSample(1, blob(10, 'audio/ogg'), 1))).toBe('hostelenglish-voz-2.ogg');
  });
});
