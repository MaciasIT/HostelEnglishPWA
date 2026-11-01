import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect, vi } from 'vitest';
import { ROLEPLAY_SCENARIOS } from '@/services/llm/roleplayPromptBuilder';
import { DepartmentSchema, parseScenarios, type RoleplayScenario } from './schema';
import { ROLEPLAY_DEPARTMENT_LABELS, CANONICAL_ROLEPLAY_SCENARIOS } from './scenarios';
import { filterScenarios, groupByDepartment, loadRoleplayCatalog } from './catalog';

const raw: unknown = JSON.parse(
  readFileSync(resolve(__dirname, '../../../public/data/roleplays.json'), 'utf8'),
);
const catalog: RoleplayScenario[] = parseScenarios(raw);
const departments = DepartmentSchema.options;

describe('public/data/roleplays.json (integridad)', () => {
  it('valida contra RoleplayScenarioSchema sin errores', () => {
    expect(() => parseScenarios(raw)).not.toThrow();
  });

  it('contiene al menos 20 escenarios', () => {
    expect(catalog.length).toBeGreaterThanOrEqual(20);
  });

  it('cubre los 5 departamentos con mínimo 4 escenarios cada uno', () => {
    const groups = groupByDepartment(catalog);
    for (const dep of departments) {
      expect(groups.get(dep)?.length ?? 0, dep).toBeGreaterThanOrEqual(4);
      expect(ROLEPLAY_DEPARTMENT_LABELS[dep]).toBeTruthy();
    }
  });

  it('no repite claves y cada una tiene persona/situación en el prompt builder', () => {
    const keys = catalog.map((s) => s.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const key of keys) {
      expect(ROLEPLAY_SCENARIOS[key].persona.length, key).toBeGreaterThan(10);
      expect(ROLEPLAY_SCENARIOS[key].situation.length, key).toBeGreaterThan(20);
      expect(ROLEPLAY_SCENARIOS[key].key).toBe(key);
    }
  });

  it('cada escenario es jugable: vocabulario suficiente, aperturas únicas y turnos 3-5', () => {
    const openings = new Set<string>();
    for (const s of catalog) {
      expect(s.expectedVocabulary.length, s.key).toBeGreaterThanOrEqual(s.minVocabularyHits + 2);
      expect(new Set(s.expectedVocabulary.map((v) => v.toLowerCase())).size, s.key).toBe(
        s.expectedVocabulary.length,
      );
      expect(s.targetTurns.min).toBeGreaterThanOrEqual(3);
      expect(s.targetTurns.max).toBeLessThanOrEqual(5);
      expect(/[.?!]$/.test(s.openingLine), s.key).toBe(true);
      openings.add(s.openingLine);
    }
    expect(openings.size).toBe(catalog.length);
  });

  it('incluye los escenarios canónicos con el mismo departamento', () => {
    for (const canon of CANONICAL_ROLEPLAY_SCENARIOS) {
      expect(catalog.find((s) => s.key === canon.key)?.department).toBe(canon.department);
    }
  });
});

describe('catálogo: agrupación, filtro y carga', () => {
  it('filtra por departamento y por texto', () => {
    expect(filterScenarios(catalog, 'bar', '').every((s) => s.department === 'bar')).toBe(true);
    const hits = filterScenarios(catalog, 'all', 'elevator');
    expect(hits.map((s) => s.key)).toContain('elevator_breakdown');
    expect(filterScenarios(catalog, 'recepcion', 'elevator')).toHaveLength(0);
  });

  it('loadRoleplayCatalog devuelve el JSON validado', async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify(raw))) as unknown as typeof fetch;
    expect((await loadRoleplayCatalog(fetcher)).length).toBe(catalog.length);
  });

  it('loadRoleplayCatalog cae al canónico si falla la red o el JSON es inválido', async () => {
    const down = vi.fn(async () => {
      throw new Error('offline');
    }) as unknown as typeof fetch;
    const bad = vi.fn(
      async () => new Response(JSON.stringify([{ key: 'nope' }])),
    ) as unknown as typeof fetch;
    expect(await loadRoleplayCatalog(down)).toEqual(CANONICAL_ROLEPLAY_SCENARIOS);
    expect(await loadRoleplayCatalog(bad)).toEqual(CANONICAL_ROLEPLAY_SCENARIOS);
  });
});
