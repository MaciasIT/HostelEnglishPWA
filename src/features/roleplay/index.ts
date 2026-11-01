/**
 * Punto de entrada público del módulo de roleplay (FC-03 + FC-04).
 */

export { RoleplayScenarioSchema, DepartmentSchema, TurnRangeSchema, parseScenarios } from './schema';
export type { RoleplayScenario, RoleplayDepartment, RoleplayTurnRange } from './schema';

export {
  CANONICAL_ROLEPLAY_SCENARIOS,
  ROLEPLAY_DEPARTMENT_LABELS,
  getScenario,
  resolveScenarioMeta,
} from './scenarios';

export { checkObjective, checkObjectiveAcrossTurns } from './goalChecker';
export type { GoalCheckResult } from './goalChecker';

export { roleplayReducer, initialState, shouldComplete, isTurnLimitReached } from './stateMachine';
export type {
  RoleplayPhase,
  RoleplayState,
  RoleplayTurn,
  RoleplayResult,
  RoleplayAction,
} from './stateMachine';

export { useRoleplayController } from './useRoleplayController';
export type { RoleplayController } from './useRoleplayController';

export { evaluatePoliteness, courtesyLevelFor, COURTESY_LEVEL_LABELS } from './courtesyEvaluator';
export type { CourtesyEvaluation, CourtesyIssue, CourtesyLevel } from './courtesyEvaluator';

export { buildHint, INACTIVITY_HINT_THRESHOLD_MS } from './hintService';
export type { RoleplayHint } from './hintService';

export { buildFeedbackSummary } from './feedbackSummary';
export type { FeedbackSummary } from './feedbackSummary';