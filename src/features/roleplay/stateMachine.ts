/**
 * Máquina de estados del roleplay (FC-03), pura y determinista.
 *
 * Modela el ciclo: turno del alumno → grabación/transcripción → generación de
 * la respuesta del cliente → verificación del objetivo, acotado a 3–5 turnos.
 *
 * El reducer es una función pura (sin efectos ni tiempo), de modo que puede
 * testearse sin React ni dependencias externas. El orquestador React
 * (`useRoleplayController`) aporta los efectos asíncronos (LLM, TTS, ASR).
 */

export type RoleplayPhase =
  | 'idle'
  | 'loading'
  | 'prompting'
  | 'listening'
  | 'thinking'
  | 'completed'
  | 'error';

export interface RoleplayTurn {
  role: 'user' | 'client';
  text: string;
}

export interface RoleplayResult {
  objectiveMet: boolean;
  turnsUsed: number;
  maxTurns: number;
  foundVocabulary: string[];
}

export interface RoleplayState {
  phase: RoleplayPhase;
  scenarioKey: string | null;
  turns: RoleplayTurn[];
  userTurnCount: number;
  minTurns: number;
  maxTurns: number;
  objectiveMet: boolean;
  result: RoleplayResult | null;
  error: string | null;
}

export type RoleplayAction =
  | { type: 'START'; scenarioKey: string; minTurns: number; maxTurns: number }
  | { type: 'OPENING'; text: string }
  | { type: 'BEGIN_LISTENING' }
  | { type: 'USER_TURN'; text: string }
  | { type: 'CLIENT_REPLY'; text: string }
  | { type: 'COMPLETE'; objectiveMet: boolean; foundVocabulary: string[] }
  | { type: 'FAIL'; message: string }
  | { type: 'RESET' };

export const initialState: RoleplayState = {
  phase: 'idle',
  scenarioKey: null,
  turns: [],
  userTurnCount: 0,
  minTurns: 3,
  maxTurns: 5,
  objectiveMet: false,
  result: null,
  error: null,
};

/**
 * Decide si la sesión debe terminar tras el turno actual.
 *
 * Reglas (criterio de aceptación "3 a 5 turnos"):
 *  - El objetivo se da por cumplido solo si se alcanzó el vocabulario y el
 *    alumno ha completado al menos `minTurns` turnos.
 *  - Se corta siempre al llegar a `maxTurns`, cumplido o no el objetivo.
 */
export function shouldComplete(input: {
  objectiveMet: boolean;
  userTurnCount: number;
  minTurns: number;
  maxTurns: number;
}): boolean {
  if (input.userTurnCount >= input.maxTurns) return true;
  return input.objectiveMet && input.userTurnCount >= input.minTurns;
}

export function isTurnLimitReached(userTurnCount: number, maxTurns: number): boolean {
  return userTurnCount >= maxTurns;
}

export function roleplayReducer(
  state: RoleplayState,
  action: RoleplayAction,
): RoleplayState {
  switch (action.type) {
    case 'START':
      return {
        ...initialState,
        phase: 'loading',
        scenarioKey: action.scenarioKey,
        minTurns: action.minTurns,
        maxTurns: action.maxTurns,
      };

    case 'OPENING':
      return {
        ...state,
        phase: 'prompting',
        turns: [...state.turns, { role: 'client', text: action.text }],
      };

    case 'BEGIN_LISTENING':
      return { ...state, phase: 'listening' };

    case 'USER_TURN':
      return {
        ...state,
        phase: 'thinking',
        turns: [...state.turns, { role: 'user', text: action.text }],
        userTurnCount: state.userTurnCount + 1,
      };

    case 'CLIENT_REPLY':
      return {
        ...state,
        phase: 'prompting',
        turns: [...state.turns, { role: 'client', text: action.text }],
      };

    case 'COMPLETE':
      return {
        ...state,
        phase: 'completed',
        objectiveMet: action.objectiveMet,
        result: {
          objectiveMet: action.objectiveMet,
          turnsUsed: state.userTurnCount,
          maxTurns: state.maxTurns,
          foundVocabulary: action.foundVocabulary,
        },
      };

    case 'FAIL':
      return { ...state, phase: 'error', error: action.message };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}