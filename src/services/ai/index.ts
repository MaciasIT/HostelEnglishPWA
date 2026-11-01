/**
 * Punto de entrada público del módulo de IA procedural (FD-03).
 *
 * Expone el generador de escenarios bajo demanda y el evaluador de adecuación
 * hostelera para facilitar su integración desde la capa de features (FD-04).
 */

export {
  generateProceduralScenario,
  generateAllProceduralScenarios,
  countProceduralCombinations,
  buildProceduralSystemPrompt,
  generateOpeningDialogue,
  PROCEDURAL_DEPARTMENTS,
  CUSTOMER_PROFILES,
  PLOT_TWISTS,
} from './proceduralRoleplayGenerator';
export type {
  ProceduralDepartment,
  CustomerProfile,
  PlotTwist,
  DepartmentDef,
  CustomerProfileDef,
  PlotTwistDef,
  ProceduralScenario,
  ProceduralScenarioDraft,
  ProceduralGenerateOptions,
  DialogueEngine,
  GeneratedOpening,
} from './proceduralRoleplayGenerator';

export {
  evaluateHospitality,
  politenessLevelFor,
  POLITENESS_LEVEL_LABELS,
} from './politenessEvaluator';
export type {
  PolitenessLevel,
  PolitenessDimensionScore,
  PolitenessEvaluation,
} from './politenessEvaluator';