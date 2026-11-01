import { describe, it, expect } from 'vitest';

import { float32ToWav } from './wav';

describe('float32ToWav — codificador PCM16', () => {
  it('genera una cabecera WAV PCM16 mono correcta', () => {
    const samples = new Float32Array([0, 0.5, -0.5, 1, -1]);
    const buf = float32ToWav(samples, 22050);
    const view = new DataView(buf);

    expect(buf.byteLength).toBe(44 + samples.length * 2);

    const fourCC = (off: number) =>
      String.fromCharCode(view.getUint8(off), view.getUint8(off + 1), view.getUint8(off + 2), view.getUint8(off + 3));

    expect(fourCC(0)).toBe('RIFF');
    expect(fourCC(8)).toBe('WAVE');
    expect(view.getUint32(4, true)).toBe(36 + samples.length * 2); // tamaño RIFF
    expect(view.getUint16(20, true)).toBe(1); // PCM
    expect(view.getUint16(22, true)).toBe(1); // mono
    expect(view.getUint32(24, true)).toBe(22050); // sample rate
    expect(view.getUint16(34, true)).toBe(16); // 16 bits
    expect(view.getUint32(40, true)).toBe(samples.length * 2); // tamaño data
  });

  it('recorta muestras fuera de rango al int16 límite', () => {
    const samples = new Float32Array([1.5, -1.5]);
    const buf = float32ToWav(samples, 16000);
    const view = new DataView(buf);
    expect(view.getInt16(44, true)).toBe(0x7fff);
    expect(view.getInt16(46, true)).toBe(-0x8000);
  });

  it('emite silencio (valor 0) para una muestra nula', () => {
    const buf = float32ToWav(new Float32Array([0]), 8000);
    expect(new DataView(buf).getInt16(44, true)).toBe(0);
  });
});