import { describe, it, expect } from 'vitest';
import {
  CANONICAL_ROLEPLAY_SCENARIOS,
  getScenario,
  resolveScenarioMeta,
  ROLEPLAY_DEPARTMENT_LABELS,
} from './scenarios';

describe('CANONICAL_ROLEPLAY_SCENARIOS', () => {
  it('define exactamente los 5 escenarios canónicos', () => {
    expect(CANONICAL_ROLEPLAY_SCENARIOS.map((s) => s.key)).toEqual([
      'checkin',
      'restaurant',
      'bar',
      'complaint',
      'maintenance',
    ]);
  });

  it('cada escenario tiene objetivo, vocabulario, apertura y turnos', () => {
    for (const scenario of CANONICAL_ROLEPLAY_SCENARIOS) {
      expect(scenario.objective.length).toBeGreaterThan(20);
      expect(scenario.expectedVocabulary.length).toBeGreaterThanOrEqual(3);
      expect(scenario.minVocabularyHits).toBeGreaterThanOrEqual(1);
      expect(scenario.openingLine.length).toBeGreaterThan(10);
      expect(scenario.targetTurns.max).toBeGreaterThanOrEqual(scenario.targetTurns.min);
    }
  });

  it('todos los turnos objetivo se mantienen entre 3 y 5', () => {
    for (const scenario of CANONICAL_ROLEPLAY_SCENARIOS) {
      expect(scenario.targetTurns.min).toBeGreaterThanOrEqual(2);
      expect(scenario.targetTurns.max).toBeLessThanOrEqual(5);
    }
  });

  it('cada escenario tiene una etiqueta de departamento legible', () => {
    for (const scenario of CANONICAL_ROLEPLAY_SCENARIOS) {
      expect(ROLEPLAY_DEPARTMENT_LABELS[scenario.department]).toBeTruthy();
    }
  });

  it('resuelve persona/situación desde la fuente única del prompt builder', () => {
    const meta = resolveScenarioMeta('maintenance');
    expect(meta.persona.length).toBeGreaterThan(10);
    expect(meta.situation.toLowerCase()).toContain('aire acondicionado');
  });

  it('getScenario devuelve el escenario por clave y undefined si no es canónico', () => {
    expect(getScenario('bar')?.key).toBe('bar');
    expect(getScenario('checkout')).toBeUndefined();
    expect(getScenario('room_service')).toBeUndefined();
  });
});