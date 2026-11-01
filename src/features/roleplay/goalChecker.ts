/**
 * Verificador de objetivo (FC-03).
 *
 * Decide si un turno del alumno cumple el objetivo del escenario comparando su
 * transcripción con el vocabulario clave esperado (`expectedVocabulary`).
 * Es una heurística determinista y local: sin red, sin LLM, testeable.
 */

import { normalizeText } from '@/utils/normalize';
import type { RoleplayScenario } from './schema';

export interface GoalCheckResult {
  /** `true` cuando se alcanzan al menos `minVocabularyHits` términos clave. */
  met: boolean;
  /** Términos clave encontrados en la transcripción. */
  hits: number;
  /** Términos mínimos exigidos por el escenario. */
  requiredHits: number;
  /** Vocabulario esperado detectado. */
  foundVocabulary: string[];
  /** Vocabulario esperado no detectado aún. */
  missingVocabulary: string[];
}

/**
 * Comprueba el objetivo contra el texto normalizado del alumno.
 *
 * La coincidencia es por subcadena tras normalizar (baja a minúsculas, elimina
 * acentos y puntuación), de modo que "air conditioning" detecta también
 * "the air-conditioning unit". Un término se da por usado si su forma
 * normalizada aparece en el texto normalizado.
 */
export function checkObjective(
  scenario: RoleplayScenario,
  transcript: string,
): GoalCheckResult {
  const normalized = normalizeText(transcript || '');

  const foundVocabulary: string[] = [];
  const missingVocabulary: string[] = [];

  for (const phrase of scenario.expectedVocabulary) {
    const normalizedPhrase = normalizeText(phrase);
    if (!normalizedPhrase) continue;
    if (normalized.includes(normalizedPhrase)) {
      foundVocabulary.push(phrase);
    } else {
      missingVocabulary.push(phrase);
    }
  }

  const hits = foundVocabulary.length;
  const met = hits >= scenario.minVocabularyHits;

  return {
    met,
    hits,
    requiredHits: scenario.minVocabularyHits,
    foundVocabulary,
    missingVocabulary,
  };
}

/**
 * Comprueba el objetivo acumulado considerando todos los turnos del alumno
 * (no solo el último). Útil para una verificación global al final de sesión.
 */
export function checkObjectiveAcrossTurns(
  scenario: RoleplayScenario,
  userTurns: string[],
): GoalCheckResult {
  return checkObjective(scenario, userTurns.join(' '));
}