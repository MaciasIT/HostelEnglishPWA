/**
 * Servicio de pistas situacionales (FC-04).
 *
 * Genera una pista discreta y determinista cuando el alumno se bloquea: una
 * frase de ejemplo en inglés más las palabras clave que aún faltan por usar.
 * Se apoya en `goalChecker` para priorizar el vocabulario pendiente del
 * escenario (sin LLM, sin red).
 */

import { checkObjectiveAcrossTurns } from './goalChecker';
import type { RoleplayScenario } from './schema';

/** Umbral de inactividad (ms) tras el que se ofrece una pista. */
export const INACTIVITY_HINT_THRESHOLD_MS = 8000;

export interface RoleplayHint {
  /** Frase de ejemplo en inglés lista para usar o adaptar. */
  phrase: string;
  /** Palabras clave sugeridas para incluir en la siguiente intervención. */
  keywords: string[];
}

/** Plantillas corteses para envolver la primera palabra clave pendiente. */
const POLITE_FRAMES: Array<(word: string) => string> = [
  (word) => `Could you please tell me something about the ${word}?`,
  (word) => `May I ask about the ${word}, please?`,
  (word) => `Could you help me with the ${word}?`,
];

/** Pista de continuación cuando todo el vocabulario ya se ha usado. */
const GENERIC_CONTINUE =
  'You are doing well — keep going with a polite phrase like “Could you please…?”.';

/**
 * Construye la pista para el escenario a partir del vocabulario pendiente.
 *
 * @param scenario Escenario en curso.
 * @param userTurns Turnos del alumno ya emitidos (para calcular lo que falta).
 */
export function buildHint(
  scenario: RoleplayScenario,
  userTurns: string[] = [],
): RoleplayHint {
  const goal = checkObjectiveAcrossTurns(scenario, userTurns);
  const missing = goal.missingVocabulary;

  if (missing.length === 0) {
    return { phrase: GENERIC_CONTINUE, keywords: [] };
  }

  const keywords = missing.slice(0, 3);
  // Elige el marco de forma determinista según el primer término pendiente.
  const frameIndex = missing[0].length % POLITE_FRAMES.length;
  const phrase = POLITE_FRAMES[frameIndex](missing[0]);

  return { phrase, keywords };
}