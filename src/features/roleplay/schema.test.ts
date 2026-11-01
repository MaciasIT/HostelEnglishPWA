import { describe, it, expect } from 'vitest';
import {
  RoleplayScenarioSchema,
  DepartmentSchema,
  TurnRangeSchema,
  parseScenarios,
} from './schema';
import { CANONICAL_ROLEPLAY_SCENARIOS } from './scenarios';

describe('RoleplayScenarioSchema', () => {
  it('valida los 5 escenarios canónicos', () => {
    const parsed = parseScenarios(CANONICAL_ROLEPLAY_SCENARIOS);
    expect(parsed).toHaveLength(5);
    expect(parsed.map((s) => s.key)).toEqual([
      'checkin',
      'restaurant',
      'bar',
      'complaint',
      'maintenance',
    ]);
  });

  it('rechaza un escenario sin vocabulario esperado', () => {
    const bad = { ...CANONICAL_ROLEPLAY_SCENARIOS[0], expectedVocabulary: [] };
    expect(() => RoleplayScenarioSchema.parse(bad)).toThrow();
  });

  it('rechaza un objetivo demasiado corto', () => {
    const bad = { ...CANONICAL_ROLEPLAY_SCENARIOS[0], objective: 'corto' };
    expect(() => RoleplayScenarioSchema.parse(bad)).toThrow();
  });

  it('valida departamentos conocidos y rechaza los desconocidos', () => {
    expect(DepartmentSchema.parse('recepcion')).toBe('recepcion');
    expect(DepartmentSchema.parse('mantenimiento')).toBe('mantenimiento');
    expect(() => DepartmentSchema.parse('cocina')).toThrow();
  });

  it('rechaza un rango de turnos inválido (max < min)', () => {
    expect(() => TurnRangeSchema.parse({ min: 5, max: 3 })).toThrow();
    expect(TurnRangeSchema.parse({ min: 3, max: 5 })).toEqual({ min: 3, max: 5 });
  });
});