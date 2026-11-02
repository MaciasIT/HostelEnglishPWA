/**
 * Verificador de objetivo (FC-03).
 *
 * Decide si un turno del alumno cumple el objetivo del escenario comparando su
 * transcripción con el vocabulario clave esperado (`expectedVocabulary`).
 * Es una heurística determinista y local: sin red, sin LLM, testeable.
 */

import { normalizeText } from '@/utils/normalize';
import type { RoleplayScenario } from './schema';
import { assertsUnverifiedSafety, isAllergenScenario } from './allergenSafety';

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
  /** `true` si en un escenario de alérgenos el alumno afirmó seguridad sin verificar. */
  unsafeClaim?: boolean;
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
  // Gate mínimo de seguridad (PM-03): "safe"/"guarantee" suman por subcadena, pero
  // afirmar seguridad sin confirmación de cocina anula el objetivo. Limitación: la
  // heurística es léxica y no comprende la semántica completa de la frase.
  const unsafeClaim = isAllergenScenario(scenario.key) && assertsUnverifiedSafety(transcript || '');
  const met = hits >= scenario.minVocabularyHits && !unsafeClaim;

  return {
    met,
    hits,
    requiredHits: scenario.minVocabularyHits,
    foundVocabulary,
    missingVocabulary,
    ...(unsafeClaim ? { unsafeClaim } : {}),
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