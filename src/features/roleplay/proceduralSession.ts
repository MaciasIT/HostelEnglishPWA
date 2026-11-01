/**
 * Adaptador entre el generador procedural (FD-03) y la sesión de roleplay
 * (FD-04). Convierte un `ProceduralScenario` en un `RoleplayScenario` jugable
 * más los metadatos (título, system prompt) que el controlador necesita.
 */

import type { ProceduralDepartment, ProceduralScenario } from '@/services/ai';
import { generateProceduralScenario } from '@/services/ai';
import { CANONICAL_ROLEPLAY_SCENARIOS } from './scenarios';
import type { RoleplayDepartment, RoleplayScenario } from './schema';
import { getClientAccent } from './accents';
import type { ClientAccent } from './accents';

/** Escenario listo para jugar (curado o procedural). */
export interface SessionScenario {
  scenario: RoleplayScenario;
  /** Título para la cabecera; si falta se resuelve desde el catálogo. */
  title?: string;
  /** System prompt completo; si falta lo construye el controlador. */
  systemPrompt?: string;
  procedural?: boolean;
}

const DEPARTMENT_MAP: Record<ProceduralDepartment, RoleplayDepartment> = {
  sala: 'restaurante',
  barra: 'bar',
  recepcion: 'recepcion',
  cocina: 'restaurante',
  pisos: 'limpieza',
};

export function toSessionScenario(
  procedural: ProceduralScenario,
  accent: ClientAccent,
): SessionScenario {
  // La clave del esquema está acotada al catálogo curado: se usa una clave base
  // solo por compatibilidad de tipos; el contenido real viene del procedural.
  const base = CANONICAL_ROLEPLAY_SCENARIOS[0];
  const scenario: RoleplayScenario = {
    ...base,
    department: DEPARTMENT_MAP[procedural.department],
    objective: procedural.objective,
    expectedVocabulary: procedural.expectedVocabulary,
    minVocabularyHits: Math.min(2, procedural.expectedVocabulary.length),
    openingLine: procedural.openingLine,
    level: procedural.level,
  };
  return {
    scenario,
    title: procedural.title,
    systemPrompt: `${procedural.systemPrompt}\n${getClientAccent(accent).promptInstruction}`,
    procedural: true,
  };
}

/** Genera un escenario procedural aleatorio (o con semilla) y lo adapta. */
export function createProceduralSession(accent: ClientAccent, seed?: number): SessionScenario {
  return toSessionScenario(generateProceduralScenario(seed === undefined ? {} : { seed }), accent);
}

/** Semilla estable por día para el «Reto de Cortesía del Día». */
export function dailyPolitenessSeed(date: Date = new Date()): number {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return y * 10000 + m * 100 + d;
}
