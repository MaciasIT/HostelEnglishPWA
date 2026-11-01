import { describe, it, expect } from 'vitest';
import { scorePronunciation } from './phoneticScorer';

describe('scorePronunciation: casos básicos', () => {
  it('frase exacta → 100 en todas las métricas', () => {
    const r = scorePronunciation('Can I have the bill please', 'Can I have the bill please', 'en');
    expect(r.accuracy).toBe(100);
    expect(r.completeness).toBe(100);
    expect(r.fluency).toBe(100);
    expect(r.prosody).toBe(100);
    expect(r.composite).toBe(100);
    expect(r.issues).toEqual([]);
  });

  it('una confusión de tensión vocálica (ship→sheep) baja la nota y se diagnostica', () => {
    const r = scorePronunciation('ship', 'sheep', 'en');
    expect(r.composite).toBeLessThan(100);
    expect(r.issues.map((i) => i.ruleId)).toContain('vowel-i-lax-tensed');
  });

  it('una confusión b/v (very→berry) se diagnostica', () => {
    const r = scorePronunciation('very', 'berry', 'en');
    expect(r.issues.map((i) => i.ruleId)).toContain('cons-v-as-b');
  });

  it('una confusión θ/s (think→sink) se diagnostica', () => {
    const r = scorePronunciation('think', 'sink', 'en');
    expect(r.issues.map((i) => i.ruleId)).toContain('th-as-s');
  });

  it('la elisión de -ed final (booked→book) se diagnostica como elisión final', () => {
    const r = scorePronunciation('booked', 'book', 'en');
    expect(r.issues.map((i) => i.category)).toContain('final-elision');
    expect(r.deletions).toBeGreaterThan(0);
  });

  it('una palabra totalmente distinta apenas puntúa', () => {
    const r = scorePronunciation('ship', 'dog', 'en');
    expect(r.composite).toBeLessThan(20);
    expect(r.completeness).toBe(0);
  });

  it('respuesta vacía → nota 0', () => {
    const r = scorePronunciation('thank you', '', 'en');
    expect(r.composite).toBe(0);
    expect(r.completeness).toBe(0);
  });

  it('objetivo y oído vacíos → neutro perfecto (nada que evaluar)', () => {
    const r = scorePronunciation('', '', 'en');
    expect(r.composite).toBe(100);
  });

  it('es determinista ante llamadas repetidas', () => {
    const a = scorePronunciation('thank you', 'sank you', 'en');
    const b = scorePronunciation('thank you', 'sank you', 'en');
    expect(a).toEqual(b);
  });
});

describe('scorePronunciation: euskera', () => {
  it('kaixo → kaixo es 100', () => {
    const r = scorePronunciation('kaixo', 'kaixo', 'eu');
    expect(r.composite).toBe(100);
  });

  it('una palabra distinta en euskera puntúa bajo y no emite diagnósticos de inglés', () => {
    const r = scorePronunciation('kaixo', 'arratsalde', 'eu');
    expect(r.composite).toBeLessThan(100);
    expect(r.issues).toEqual([]);
  });
});

describe('scorePronunciation: correlación con referencia humana controlada', () => {
  /**
   * Muestras fonéticas controladas: cada par (objetivo, oído) lleva una nota de
   * calidad anotada con una rúbrica humana coherente:
   *   100 perfecto · ~82 un error segmental sutil (catálogo) · ~65 una elisión
   *   · ~48 sílaba/-ed omitido · ~8 palabra errónea · 0 silencio.
   * Se exige correlación de Pearson > 0.7 con el composite del scorer.
   */
  const reference: Array<{ target: string; heard: string; human: number }> = [
    { target: 'ship', heard: 'ship', human: 100 },
    { target: 'very', heard: 'very', human: 100 },
    { target: 'think', heard: 'think', human: 100 },
    { target: 'room', heard: 'room', human: 100 },
    { target: 'ship', heard: 'sheep', human: 80 },
    { target: 'sheep', heard: 'ship', human: 80 },
    { target: 'very', heard: 'berry', human: 82 },
    { target: 'think', heard: 'sink', human: 82 },
    { target: 'thank you', heard: 'sank you', human: 78 },
    { target: 'think', heard: 'tink', human: 62 },
    { target: 'room', heard: 'roo', human: 65 },
    { target: 'booked', heard: 'book', human: 48 },
    { target: 'thank you', heard: 'tank yu', human: 55 },
    { target: 'ship', heard: 'dog', human: 8 },
    { target: 'thank you', heard: '', human: 0 },
  ];

  function pearson(xs: number[], ys: number[]): number {
    const n = xs.length;
    const mx = xs.reduce((a, b) => a + b, 0) / n;
    const my = ys.reduce((a, b) => a + b, 0) / n;
    let cov = 0;
    let vx = 0;
    let vy = 0;
    for (let i = 0; i < n; i += 1) {
      cov += (xs[i] - mx) * (ys[i] - my);
      vx += (xs[i] - mx) ** 2;
      vy += (ys[i] - my) ** 2;
    }
    return cov / (Math.sqrt(vx) * Math.sqrt(vy));
  }

  it('correlaciona > 0.7 con la rúbrica humana', () => {
    const scores = reference.map((r) => scorePronunciation(r.target, r.heard, 'en').composite);
    const humans = reference.map((r) => r.human);
    expect(pearson(scores, humans)).toBeGreaterThan(0.7);
  });
});