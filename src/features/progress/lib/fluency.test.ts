import { describe, it, expect } from 'vitest';
import { calculateFluency, speedToScore } from './fluency';

describe('fluency', () => {
  it('speedToScore: límites y tramo lineal', () => {
    expect(speedToScore(1)).toBe(100);
    expect(speedToScore(2)).toBe(100);
    expect(speedToScore(7)).toBe(50);
    expect(speedToScore(20)).toBe(0);
  });
  it('media ponderada 30/40/30', () => {
    const r = calculateFluency({ avgSecondsPerPhrase: 7, phoneticAccuracy: 80, roleplaysResolved: 3, roleplaysAttempted: 4 });
    // 0.3*50 + 0.4*80 + 0.3*75 = 69.5 → 70
    expect(r.score).toBe(70);
    expect(r.level).toBe('B1');
  });
  it('renormaliza pesos si falta un componente', () => {
    const r = calculateFluency({ phoneticAccuracy: 100, avgSecondsPerPhrase: 2 });
    expect(r.roleplayScore).toBeNull();
    expect(r.score).toBe(100);
    expect(r.weights.roleplay).toBe(0);
    expect(r.weights.speed + r.weights.accuracy).toBeCloseTo(1);
  });
  it('sin datos → 0 / A2', () => {
    const r = calculateFluency({});
    expect(r.score).toBe(0);
    expect(r.level).toBe('A2');
  });
  it('acota precisión fuera de rango', () => {
    expect(calculateFluency({ phoneticAccuracy: 150 }).accuracyScore).toBe(100);
  });
});
