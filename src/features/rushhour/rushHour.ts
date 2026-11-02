/**
 * Motor «Rush Hour» (PM-02): modo contrarreloj de 5 situaciones imprevistas.
 *
 * Lógica pura y determinista (sin React, sin red) que se apoya en la fuente
 * única de verdad de escenarios (`CANONICAL_ROLEPLAY_SCENARIOS`) para no
 * duplicar contenido de dominio, y en el evaluador de adecuación hostelera
 * (`evaluateHospitality`) para la dimensión de cortesía.
 *
 * La evaluación combinada de cada respuesta pondera a partes iguales:
 *  - **velocidad**: tiempo transcurrido hasta responder, acotado por un
 *    presupuesto por comanda (2 min / 5 = 24 s) con tramo ideal ≤ 10 s.
 *  - **cortesía hostelera**: nota 0–100 de `evaluateHospitality`.
 */

import { CANONICAL_ROLEPLAY_SCENARIOS, ROLEPLAY_DEPARTMENT_LABELS } from '@/features/roleplay/scenarios';
import type { RoleplayDepartment } from '@/features/roleplay/schema';
import { evaluateHospitality } from '@/services/ai';
import type { PolitenessEvaluation } from '@/services/ai';

/* ------------------------------------------------------------------------- */
/* Constantes del modo                                                        */
/* ------------------------------------------------------------------------- */

export const RUSH_HOUR_TOTAL_SITUATIONS = 5;

/** Tiempo límite global: 2 minutos. */
export const RUSH_HOUR_TIME_LIMIT_MS = 2 * 60 * 1000;

/** Presupuesto por comanda (ms): 2 min entre 5 = 24 s. */
export const RUSH_HOUR_BUDGET_PER_SITUATION_MS =
  RUSH_HOUR_TIME_LIMIT_MS / RUSH_HOUR_TOTAL_SITUATIONS;

/** Tramo de velocidad ideal: responder en ≤ 10 s otorga velocidad máxima. */
export const RUSH_HOUR_IDEAL_RESPONSE_MS = 10_000;

/* ------------------------------------------------------------------------- */
/* Situaciones                                                               */
/* ------------------------------------------------------------------------- */

export interface RushHourSituation {
  id: string;
  department: RoleplayDepartment;
  departmentLabel: string;
  /** Instrucción en español (qué se espera que resuelvas). */
  instruction: string;
  /** Línea del cliente en inglés a la que responder. */
  prompt: string;
}

/**
 * Las 5 comandas/situaciones imprevistas. Derivadas de los escenarios
 * canónicos (única fuente de verdad): su `objective` es la instrucción y su
 * `openingLine` la situación lanzada por el cliente.
 */
export const RUSH_HOUR_SITUATIONS: readonly RushHourSituation[] =
  CANONICAL_ROLEPLAY_SCENARIOS.map((scenario) => ({
    id: scenario.key,
    department: scenario.department,
    departmentLabel: ROLEPLAY_DEPARTMENT_LABELS[scenario.department],
    instruction: scenario.objective,
    prompt: scenario.openingLine,
  }));

/* ------------------------------------------------------------------------- */
/* Evaluación                                                                */
/* ------------------------------------------------------------------------- */

/** Tiempo restante (ms) dado un vencimiento y un instante actual. */
export function remainingMs(deadline: number, now: number): number {
  return Math.max(0, deadline - now);
}

/**
 * Nota de velocidad (0–100) según el tiempo transcurrido.
 * ≤ ideal → 100; entre ideal y presupuesto → decae linealmente; ≥ presupuesto → 0.
 */
export function speedScoreFor(
  elapsedMs: number,
  budgetMs: number = RUSH_HOUR_BUDGET_PER_SITUATION_MS,
  idealMs: number = RUSH_HOUR_IDEAL_RESPONSE_MS,
): number {
  if (elapsedMs <= 0) return 100;
  if (elapsedMs <= idealMs) return 100;
  const decay = (elapsedMs - idealMs) / (budgetMs - idealMs);
  const score = Math.round(100 * (1 - Math.min(1, decay)));
  return Math.max(0, Math.min(100, score));
}

/** Respuesta emitida por el alumno contra una situación. */
export interface RushHourAnswer {
  situationId: string;
  /** Tiempo transcurrido (ms) desde que se presentó la situación. */
  elapsedMs: number;
  text: string;
}

/** Puntuación detallada de una respuesta. */
export interface RushHourAnswerScore {
  situationId: string;
  elapsedMs: number;
  speedScore: number;
  courtesyScore: number;
  /** Media de velocidad y cortesía (0–100). */
  combinedScore: number;
  politeness: PolitenessEvaluation;
}

/** Evalúa velocidad + cortesía de una respuesta y las combina. */
export function scoreRushHourAnswer(
  answer: RushHourAnswer,
  budgetMs: number = RUSH_HOUR_BUDGET_PER_SITUATION_MS,
): RushHourAnswerScore {
  const politeness = evaluateHospitality(answer.text);
  const speedScore = speedScoreFor(answer.elapsedMs, budgetMs);
  const courtesyScore = politeness.politenessScore;
  const combinedScore = Math.round(0.5 * speedScore + 0.5 * courtesyScore);

  return {
    situationId: answer.situationId,
    elapsedMs: answer.elapsedMs,
    speedScore,
    courtesyScore,
    combinedScore,
    politeness,
  };
}

/* ------------------------------------------------------------------------- */
/* Resumen                                                                   */
/* ------------------------------------------------------------------------- */

export interface RushHourSummary {
  /** Media de velocidad (0–100). */
  averageSpeed: number;
  /** Media de cortesía (0–100). */
  averageCourtesy: number;
  /** Media combinada (0–100). */
  averageCombined: number;
  answeredCount: number;
  totalCount: number;
  completed: boolean;
  scores: RushHourAnswerScore[];
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, v) => acc + v, 0);
  return Math.round(sum / values.length);
}

/** Consolida las puntuaciones en un resumen de la ronda. */
export function summarizeRushHour(
  scores: RushHourAnswerScore[],
  totalCount: number = RUSH_HOUR_TOTAL_SITUATIONS,
): RushHourSummary {
  return {
    averageSpeed: average(scores.map((s) => s.speedScore)),
    averageCourtesy: average(scores.map((s) => s.courtesyScore)),
    averageCombined: average(scores.map((s) => s.combinedScore)),
    answeredCount: scores.length,
    totalCount,
    completed: scores.length >= totalCount,
    scores,
  };
}

/** Etiqueta legible de la nota combinada (umbrales compartidos con FD-04). */
export function rushHourGrade(score: number): string {
  if (score >= 85) return 'Excelente';
  if (score >= 55) return 'Buen trabajo';
  if (score >= 30) return 'Mejorable';
  return 'Necesitas práctica';
}