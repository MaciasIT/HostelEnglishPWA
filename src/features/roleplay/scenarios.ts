/**
 * Los 5 escenarios canónicos de hostelería del módulo de roleplay (FC-03).
 *
 * Cada escenario añade la capa "jugable" (objetivo, vocabulario esperado,
 * turnos objetivo y apertura) sobre la persona/situación definida en
 * `src/services/llm/roleplayPromptBuilder.ts`, que sigue siendo la única
 * fuente de verdad de `persona` y `situation`.
 */

import { ROLEPLAY_SCENARIOS, type RoleplayScenarioKey } from '@/services/llm/roleplayPromptBuilder';
import type { RoleplayDepartment, RoleplayScenario } from './schema';

/** Etiquetas legibles de cada departamento, para la UI de selección. */
export const ROLEPLAY_DEPARTMENT_LABELS: Record<RoleplayDepartment, string> = {
  recepcion: 'Recepción',
  restaurante: 'Restaurante',
  bar: 'Bar',
  limpieza: 'Pisos / Limpieza',
  mantenimiento: 'Mantenimiento',
};

/** Los 5 escenarios canónicos del MVP. */
export const CANONICAL_ROLEPLAY_SCENARIOS: RoleplayScenario[] = [
  {
    key: 'checkin',
    department: 'recepcion',
    objective:
      'Verifica la identidad del cliente, busca su reserva o disponibilidad y ofrece una solución de alojamiento para esta noche.',
    expectedVocabulary: [
      'reservation',
      'booking',
      'passport',
      'availability',
      'apologise',
      'room',
      'confirmation',
      'id',
    ],
    minVocabularyHits: 3,
    openingLine:
      "Good evening. I have a reservation, but I don't see it in your system. Can you help me?",
    targetTurns: { min: 3, max: 5 },
    level: 'B1-B2',
  },
  {
    key: 'restaurant',
    department: 'restaurante',
    objective:
      'Identifica los alérgenos de la carta y recomienda platos seguros sin gluten ni frutos secos.',
    expectedVocabulary: [
      'gluten',
      'allergy',
      'allergen',
      'nuts',
      'menu',
      'ingredients',
      'recommend',
      'safe',
    ],
    minVocabularyHits: 3,
    openingLine:
      'Good evening. I have a gluten intolerance and a nut allergy. What can I order from the menu?',
    targetTurns: { min: 3, max: 5 },
    level: 'B1-B2',
  },
  {
    key: 'bar',
    department: 'bar',
    objective:
      'Toma un pedido de coctelería concreto y sugiere tapas locales que mariden con la bebida.',
    expectedVocabulary: [
      'cocktail',
      'martini',
      'gin',
      'tapas',
      'recommend',
      'local',
      'pairing',
      'bitters',
    ],
    minVocabularyHits: 3,
    openingLine:
      "Hi! I'd like a dry martini, please. And could you recommend some local tapas to go with it?",
    targetTurns: { min: 3, max: 5 },
    level: 'B1-B2',
  },
  {
    key: 'complaint',
    department: 'limpieza',
    objective:
      'Pide disculpas, ofrece una solución inmediata (enviar toallas y amenities) y confirma cuándo llegarán.',
    expectedVocabulary: [
      'apologise',
      'sorry',
      'towels',
      'toiletries',
      'amenities',
      'immediately',
      'send',
      'room',
    ],
    minVocabularyHits: 3,
    openingLine:
      'Excuse me, there are no towels or toiletries in my room. This is really disappointing.',
    targetTurns: { min: 3, max: 5 },
    level: 'B1-B2',
  },
  {
    key: 'maintenance',
    department: 'mantenimiento',
    objective:
      'Registra la incidencia, tranquiliza al huésped y confirma que un técnico acudirá a revisar la fuga.',
    expectedVocabulary: [
      'air conditioning',
      'leak',
      'water',
      'technician',
      'engineer',
      'fix',
      'inspect',
      'room number',
    ],
    minVocabularyHits: 3,
    openingLine:
      'Hello, the air conditioning in my room is leaking water onto the floor. Can you send someone to fix it?',
    targetTurns: { min: 3, max: 5 },
    level: 'B1-B2',
  },
];

/** Devuelve el escenario jugable por su clave, o `undefined`. */
export function getScenario(key: RoleplayScenarioKey): RoleplayScenario | undefined {
  return CANONICAL_ROLEPLAY_SCENARIOS.find((scenario) => scenario.key === key);
}

/** Resuelve título/persona/situación desde la fuente única del prompt builder. */
export function resolveScenarioMeta(key: RoleplayScenarioKey) {
  const base = ROLEPLAY_SCENARIOS[key];
  return {
    title: base.title,
    persona: base.persona,
    situation: base.situation,
  };
}