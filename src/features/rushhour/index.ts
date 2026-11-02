/**
 * Punto de entrada público del modo «Rush Hour» (PM-02).
 */

export {
  RUSH_HOUR_BUDGET_PER_SITUATION_MS,
  RUSH_HOUR_IDEAL_RESPONSE_MS,
  RUSH_HOUR_SITUATIONS,
  RUSH_HOUR_TIME_LIMIT_MS,
  RUSH_HOUR_TOTAL_SITUATIONS,
  remainingMs,
  rushHourGrade,
  scoreRushHourAnswer,
  speedScoreFor,
  summarizeRushHour,
} from './rushHour';
export type {
  RushHourAnswer,
  RushHourAnswerScore,
  RushHourSituation,
  RushHourSummary,
} from './rushHour';