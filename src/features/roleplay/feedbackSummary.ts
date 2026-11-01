/**
 * Tarjeta de resumen de feedback (FC-04).
 *
 * Agrega los turnos del alumno en tres dimensiones para mostrarlas al cerrar
 * el escenario: puntuación de cortesía, vocabulario técnico utilizado y áreas
 * de mejora. Todo el cálculo es determinista y local.
 */

import { evaluatePoliteness } from './courtesyEvaluator';
import { courtesyLevelFor } from './courtesyEvaluator';
import type { CourtesyLevel } from './courtesyEvaluator';
import type { GoalCheckResult } from './goalChecker';

export interface FeedbackSummary {
  /** ¿Se alcanzó el objetivo de vocabulario del escenario? */
  objectiveMet: boolean;
  /** Puntuación media de cortesía de los turnos (0–100, redondeada). */
  politenessScore: number;
  /** Etiqueta legible del nivel de cortesía. */
  politenessLevel: CourtesyLevel;
  /** Vocabulario técnico detectado en los turnos del alumno. */
  technicalVocabularyUsed: string[];
  /** Vocabulario esperado que no llegó a usarse. */
  missingVocabulary: string[];
  /** Áreas de mejora concretas (en español). */
  areasToImprove: string[];
  /** Puntos fuertes concretos (en español). */
  strengths: string[];
}

interface BuildFeedbackSummaryInput {
  userTurns: string[];
  /** Resultado acumulado del verificador de objetivo. */
  goal: GoalCheckResult;
}

function round(value: number): number {
  return Math.round(value);
}

/**
 * Construye el resumen de feedback agregando cortesía y vocabulario.
 *
 * - Cortesía: media de las evaluaciones por turno.
 * - Vocabulario técnico: términos clave encontrados (de `goal`).
 * - Áreas de mejora: problemas de cortesía desduplicados + vocabulario ausente.
 * - Puntos fuertes: marcadores de cortesía usados + vocabulario conseguido.
 */
export function buildFeedbackSummary(
  input: BuildFeedbackSummaryInput,
): FeedbackSummary {
  const { userTurns, goal } = input;

  const evaluations = userTurns.map((turn) => evaluatePoliteness(turn));
  const scores = evaluations.map((e) => e.politenessScore);
  const politenessScore =
    scores.length > 0 ? round(scores.reduce((a, b) => a + b, 0) / scores.length) : 100;

  // Desduplica problemas de cortesía por mensaje (misma mejora, misma sugerencia).
  const improvementMessages = new Map<string, string>();
  for (const evaluation of evaluations) {
    for (const issue of evaluation.issues) {
      if (!improvementMessages.has(issue.message)) {
        improvementMessages.set(issue.message, issue.suggestion);
      }
    }
  }

  const areasToImprove: string[] = [];
  for (const message of improvementMessages.keys()) {
    areasToImprove.push(message);
  }
  if (goal.missingVocabulary.length > 0) {
    areasToImprove.push(
      `Incluye vocabulario técnico del sector: ${goal.missingVocabulary.join(', ')}.`,
    );
  }

  const politeMarkersUsed = Array.from(
    new Set(evaluations.flatMap((e) => e.politeMarkers)),
  );
  const strengths: string[] = [];
  if (goal.foundVocabulary.length > 0) {
    strengths.push(`Vocabulario técnico utilizado: ${goal.foundVocabulary.join(', ')}.`);
  }
  if (politeMarkersUsed.length > 0) {
    strengths.push(
      `Fórmulas de cortesía empleadas: ${politeMarkersUsed.join(', ')}.`,
    );
  }

  return {
    objectiveMet: goal.met,
    politenessScore,
    politenessLevel: courtesyLevelFor(politenessScore),
    technicalVocabularyUsed: goal.foundVocabulary,
    missingVocabulary: goal.missingVocabulary,
    areasToImprove,
    strengths,
  };
}

export type { CourtesyLevel };