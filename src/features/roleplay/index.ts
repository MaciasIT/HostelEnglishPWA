/**
 * Punto de entrada público del módulo de roleplay (FC-03).
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