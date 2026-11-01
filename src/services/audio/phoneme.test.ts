import { describe, it, expect } from 'vitest';
import { featureSimilarity, tokenizeIPA } from './phoneme';

describe('tokenizeIPA', () => {
  it('resuelve símbolos multígrafo con prioridad sobre los simples (tʃ antes que t)', () => {
    const phonemes = tokenizeIPA('tʃek');
    expect(phonemes.map((p) => p.symbol)).toEqual(['tʃ', 'e', 'k']);
  });

  it('reconoce vocales con marca de longitud', () => {
    const phonemes = tokenizeIPA('ʃiːp');
    expect(phonemes.map((p) => p.symbol)).toEqual(['ʃ', 'iː', 'p']);
  });

  it('aplica el acento primario a la vocal de la sílaba (no a la consonante inicial)', () => {
    const phonemes = tokenizeIPA('ˈbrekfəst');
    const e = phonemes.find((p) => p.symbol === 'e');
    const b = phonemes.find((p) => p.symbol === 'b');
    expect(e?.stress).toBe(1);
    expect(b?.stress).toBe(0);
  });

  it('ignora caracteres desconocidos', () => {
    const phonemes = tokenizeIPA('2a%z9');
    expect(phonemes.map((p) => p.symbol)).toEqual(['a', 'z']);
  });

  it('devuelve vacío para entrada vacía', () => {
    expect(tokenizeIPA('')).toEqual([]);
  });
});

describe('featureSimilarity', () => {
  it('un símbolo es idéntico a sí mismo', () => {
    expect(featureSimilarity('θ', 'θ')).toBe(1);
  });

  it('vocal contra consonante es disimilar (0)', () => {
    expect(featureSimilarity('p', 'a')).toBe(0);
  });

  it('dos fricativas sordas son cercanas', () => {
    expect(featureSimilarity('θ', 's')).toBeGreaterThanOrEqual(0.5);
  });

  it('símbolo desconocido devuelve 0', () => {
    expect(featureSimilarity('Ω', 'a')).toBe(0);
  });
});