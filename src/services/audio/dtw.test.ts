import { describe, it, expect } from 'vitest';
import { alignPhonemes } from './dtw';
import type { Phoneme } from './phoneme';
import { DELETION_COST, INSERTION_COST, substitutionCost } from './pronunciationCatalog';

const ph = (symbols: string[]): Phoneme[] => symbols.map((symbol) => ({ symbol, stress: 0 }));
const costs = {
  substitution: (x: Phoneme, y: Phoneme) => substitutionCost(x.symbol, y.symbol),
  insertion: () => INSERTION_COST,
  deletion: () => DELETION_COST,
};

describe('alignPhonemes (DTW)', () => {
  it('secuencias idénticas → distancia 0 y todo match', () => {
    const r = alignPhonemes(ph(['ʃ', 'ɪ', 'p']), ph(['ʃ', 'ɪ', 'p']), costs);
    expect(r.distance).toBe(0);
    expect(r.matches).toBe(3);
    expect(r.substitutions).toBe(0);
    expect(r.insertions).toBe(0);
    expect(r.deletions).toBe(0);
  });

  it('una sustitución (ɪ→iː) se detecta como sustitución', () => {
    const r = alignPhonemes(ph(['ʃ', 'ɪ', 'p']), ph(['ʃ', 'iː', 'p']), costs);
    expect(r.substitutions).toBe(1);
    expect(r.matches).toBe(2);
    expect(r.distance).toBeGreaterThan(0);
    expect(r.distance).toBeLessThan(1); // coste reducido del catálogo
  });

  it('una eliminación de fonema final', () => {
    const r = alignPhonemes(ph(['ɹ', 'uː', 'm']), ph(['ɹ', 'uː']), costs);
    expect(r.deletions).toBe(1);
    expect(r.matches).toBe(2);
  });

  it('una inserción de fonema extra', () => {
    const r = alignPhonemes(ph(['k', 'a']), ph(['k', 'a', 't']), costs);
    expect(r.insertions).toBe(1);
    expect(r.matches).toBe(2);
  });

  it('secuencias disjuntas no producen matches', () => {
    const r = alignPhonemes(ph(['ʃ', 'ɪ', 'p']), ph(['d', 'ɒ', 'ɡ']), costs);
    expect(r.matches).toBe(0);
    expect(r.distance).toBeGreaterThan(0);
  });

  it('entrada vacía contra no vacía → todas inserciones', () => {
    const r = alignPhonemes([], ph(['h', 'i']), costs);
    expect(r.insertions).toBe(2);
    expect(r.matches).toBe(0);
  });

  it('ambas vacías → distancia 0 y camino vacío', () => {
    const r = alignPhonemes([], [], costs);
    expect(r.distance).toBe(0);
    expect(r.path).toEqual([]);
  });
});