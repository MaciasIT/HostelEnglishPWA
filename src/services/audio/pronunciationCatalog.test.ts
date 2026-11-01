import { describe, it, expect } from 'vitest';
import {
  DIFFERENT_COST,
  findConfusion,
  substitutionCost,
  MATCH_COST,
} from './pronunciationCatalog';

describe('findConfusion', () => {
  it('reconoce la sustitución θ→s (think→sink)', () => {
    const rule = findConfusion('θ', 's');
    expect(rule?.category).toBe('dental-fricative');
    expect(rule?.example).toBe('think → sink');
  });

  it('reconoce v→b (very→berry)', () => {
    expect(findConfusion('v', 'b')?.category).toBe('consonant-voice');
  });

  it('reconoce ɪ→iː (ship→sheep)', () => {
    expect(findConfusion('ɪ', 'iː')?.category).toBe('vowel-tenseness');
  });

  it('devuelve null para pares no catalogados', () => {
    expect(findConfusion('p', 'b')).toBeNull();
  });
});

describe('substitutionCost', () => {
  it('fonemas idénticos no cuestan nada', () => {
    expect(substitutionCost('p', 'p')).toBe(MATCH_COST);
  });

  it('las confusiones del catálogo tienen coste reducido (< 0.5)', () => {
    expect(substitutionCost('θ', 's')).toBeLessThan(0.5);
    expect(substitutionCost('v', 'b')).toBeLessThan(0.5);
    expect(substitutionCost('ɪ', 'iː')).toBeLessThan(0.5);
  });

  it('fonemas totalmente distintos pagan coste completo', () => {
    expect(substitutionCost('p', 'm')).toBe(DIFFERENT_COST);
  });
});