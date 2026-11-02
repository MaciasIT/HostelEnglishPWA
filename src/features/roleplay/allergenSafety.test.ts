import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { generateCustomerReply } from './fallbackResponder';
import { checkObjective } from './goalChecker';
import { assertsUnverifiedSafety, ALLERGEN_SCENARIO_KEYS } from './allergenSafety';
import { getScenario } from './scenarios';
import type { RoleplayScenario } from './schema';

const catalog = JSON.parse(
  readFileSync(resolve(process.cwd(), 'public/data/roleplays.json'), 'utf8'),
) as RoleplayScenario[];

const scenario = (key: string): RoleplayScenario => {
  const s = catalog.find((c) => c.key === key);
  if (!s) throw new Error(`missing ${key}`);
  return s;
};

const AFFIRMS =
  /\b(is|are|sounds?)\b[^.]*\bsafe\b|safe for my diet|no traces|nut[- ]free|gluten[- ]free for sure/i;
const INPUTS = [
  'safe',
  'It is safe, I guarantee it.',
  'This dish has no nuts, do not worry.',
  'Let me check the menu and recommend a dish.',
  'I will ask the kitchen to confirm the ingredients.',
  'gluten allergy',
  'Sorry about that.',
  'Let me check one moment.',
  '',
];

describe('respondedor offline: escenarios de alérgenos PM-03', () => {
  for (const key of ALLERGEN_SCENARIO_KEYS) {
    it(`${key}: nunca afirma que el plato es seguro`, () => {
      for (const input of INPUTS) {
        for (let turn = 0; turn < 4; turn++) {
          const reply = generateCustomerReply(scenario(key), input, turn);
          expect(reply, `${key} / "${input}"`).not.toMatch(AFFIRMS);
          expect(reply.length).toBeGreaterThan(0);
        }
      }
    });
  }

  it('anafilaxia: la reacción grave deriva en 112', () => {
    const s = scenario('pm03_anaphylaxis_112');
    expect(generateCustomerReply(s, 'Are you ok? Tell me more.', 1)).toMatch(/112/);
    expect(generateCustomerReply(s, 'I will call 112 now.', 1)).toMatch(/112/);
    expect(generateCustomerReply(s, 'I am calling the manager.', 1)).toMatch(/112/);
  });

  it('anafilaxia: no acepta tratamiento ni diagnóstico del alumno', () => {
    const reply = generateCustomerReply(
      scenario('pm03_anaphylaxis_112'),
      'Take this antihistamine pill.',
      1,
    );
    expect(reply).toMatch(/112/);
    expect(reply).toMatch(/not give me any medicine/i);
  });

  it('contacto cruzado con marisco: para el servicio y escala (112 si hay reacción)', () => {
    const reply = generateCustomerReply(
      scenario('pm03_shellfish_cross_contact'),
      'Let me help you.',
      1,
    );
    expect(reply).toMatch(/stop serving/i);
    expect(reply).toMatch(/manager/i);
    expect(reply).toMatch(/112/);
  });

  it('afirmar seguridad sin confirmar provoca réplica de cautela', () => {
    const reply = generateCustomerReply(scenario('pm03_nut_allergy'), 'Yes, it is safe.', 1);
    expect(reply).toMatch(/how can you be sure/i);
    expect(reply).toMatch(/kitchen/i);
  });

  it('el genérico de restaurante ya no afirma seguridad', () => {
    const restaurant = getScenario('restaurant')!;
    const reply = generateCustomerReply(restaurant, 'Here is the menu, a gluten free dish.', 1);
    expect(reply).not.toMatch(/safe for my diet/i);
  });
});

describe('assertsUnverifiedSafety', () => {
  it.each(['It is safe.', 'I guarantee it.', 'This is 100% safe to eat', 'There are no nuts in it.'])(
    'detecta afirmación: %s',
    (t) => expect(assertsUnverifiedSafety(t)).toBe(true),
  );

  it.each([
    'I cannot guarantee it is safe.',
    "It isn't safe until the kitchen confirms.",
    'Once the kitchen confirms it is safe, I will let you know.',
    'Let me check with the kitchen.',
  ])('no marca: %s', (t) => expect(assertsUnverifiedSafety(t)).toBe(false));
});

describe('goalChecker: gate de seguridad PM-03', () => {
  it('safe + guarantee afirmados sin verificar NO cumplen el objetivo', () => {
    const r = checkObjective(
      scenario('pm03_nut_allergy'),
      'Yes it is safe, I guarantee it. Kitchen, ingredients, nut allergy.',
    );
    expect(r.hits).toBeGreaterThanOrEqual(3);
    expect(r.unsafeClaim).toBe(true);
    expect(r.met).toBe(false);
  });

  it('negar la garantía y confirmar con cocina sí cumple', () => {
    const r = checkObjective(
      scenario('pm03_nut_allergy'),
      'I cannot guarantee it is safe. I will ask the kitchen to confirm the ingredients and avoid cross-contamination.',
    );
    expect(r.unsafeClaim).toBeUndefined();
    expect(r.met).toBe(true);
  });
});
