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

describe('PM-03: roleplays de sumillería, coctelería y alérgenos', () => {
  const PM03_KEYS = {
    sumilleria: ['pm03_wine_pairing', 'pm03_vintage_decanting', 'pm03_tasting_notes'],
    cocteleria: ['pm03_signature_cocktail', 'pm03_premium_spirit', 'pm03_classic_twist'],
    alergenos: [
      'pm03_nut_allergy',
      'pm03_coeliac',
      'pm03_shellfish_cross_contact',
      'pm03_anaphylaxis_112',
    ],
  };
  const allKeys = Object.values(PM03_KEYS).flat();
  const pm03 = catalog.filter((s) => s.key.startsWith('pm03_'));
  const scenarioOf = (key: string) => ROLEPLAY_SCENARIOS[key as keyof typeof ROLEPLAY_SCENARIOS];

  it('hay exactamente diez, únicos y con las claves del entregable', () => {
    expect(pm03).toHaveLength(10);
    expect(new Set(pm03.map((s) => s.key)).size).toBe(10);
    expect(pm03.map((s) => s.key).sort()).toEqual([...allKeys].sort());
  });

  it('reparto 3/3/4 con departamento restaurante / bar / restaurante', () => {
    const dept = (keys: string[]) => keys.map((k) => pm03.find((s) => s.key === k)?.department);
    expect(dept(PM03_KEYS.sumilleria)).toEqual(Array(3).fill('restaurante'));
    expect(dept(PM03_KEYS.cocteleria)).toEqual(Array(3).fill('bar'));
    expect(dept(PM03_KEYS.alergenos)).toEqual(Array(4).fill('restaurante'));
  });

  it('cada clave existe en ROLEPLAY_SCENARIOS con persona y situación', () => {
    for (const key of allKeys) {
      const sc = scenarioOf(key);
      expect(sc, key).toBeDefined();
      expect(sc.key).toBe(key);
      expect(sc.persona.length, key).toBeGreaterThan(10);
      expect(sc.situation.length, key).toBeGreaterThan(20);
    }
  });

  it('son jugables: vocabulario, turnos 3-5 y aperturas únicas en todo el catálogo', () => {
    const otherOpenings = new Set(
      catalog.filter((s) => !s.key.startsWith('pm03_')).map((s) => s.openingLine),
    );
    for (const s of pm03) {
      expect(s.expectedVocabulary.length, s.key).toBeGreaterThanOrEqual(s.minVocabularyHits + 2);
      expect(s.targetTurns.min, s.key).toBeGreaterThanOrEqual(3);
      expect(s.targetTurns.max, s.key).toBeLessThanOrEqual(5);
      expect(/[.?!]$/.test(s.openingLine), s.key).toBe(true);
      expect(otherOpenings.has(s.openingLine), s.key).toBe(false);
    }
    expect(new Set(pm03.map((s) => s.openingLine)).size).toBe(10);
  });

  it('las situaciones alimentarias prohíben afirmar seguridad sin verificar y escalan al 112', () => {
    for (const key of PM03_KEYS.alergenos) {
      const sit = scenarioOf(key).situation;
      expect(sit, key).toMatch(/no afirmes/i);
      expect(sit, key).toMatch(/112/);
      expect(sit, key).toMatch(/sin diagnosticar|no diagnostiques/i);
    }
    for (const key of ['pm03_nut_allergy', 'pm03_coeliac', 'pm03_shellfish_cross_contact']) {
      const sit = scenarioOf(key).situation;
      expect(sit, key).toMatch(/cocina/i);
      expect(sit, key).toMatch(/no se puede garantizar/i);
    }
  });

  it('los escenarios previos siguen presentes', () => {
    expect(catalog.length - pm03.length).toBeGreaterThanOrEqual(24);
    expect(ROLEPLAY_SCENARIOS.restaurant.title).toBe('Cliente con alergias y restricciones');
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
