import { describe, it, expect } from 'vitest';
import { initialState, roleplayReducer, shouldComplete, isTurnLimitReached } from './stateMachine';

const start = (overrides: { minTurns?: number; maxTurns?: number } = {}) =>
  roleplayReducer(initialState, {
    type: 'START',
    scenarioKey: 'checkin',
    minTurns: overrides.minTurns ?? 3,
    maxTurns: overrides.maxTurns ?? 5,
  });

describe('roleplayReducer', () => {
  it('START pasa a loading y resetea turnos', () => {
    const s = start();
    expect(s.phase).toBe('loading');
    expect(s.scenarioKey).toBe('checkin');
    expect(s.minTurns).toBe(3);
    expect(s.maxTurns).toBe(5);
    expect(s.turns).toHaveLength(0);
    expect(s.userTurnCount).toBe(0);
  });

  it('OPENING añade el turno del cliente y pasa a prompting', () => {
    const s = roleplayReducer(start(), { type: 'OPENING', text: 'Good evening.' });
    expect(s.phase).toBe('prompting');
    expect(s.turns).toEqual([{ role: 'client', text: 'Good evening.' }]);
  });

  it('USER_TURN incrementa el contador y pasa a thinking', () => {
    let s = roleplayReducer(start(), { type: 'OPENING', text: 'opening' });
    s = roleplayReducer(s, { type: 'BEGIN_LISTENING' });
    expect(s.phase).toBe('listening');
    s = roleplayReducer(s, { type: 'USER_TURN', text: 'hello' });
    expect(s.phase).toBe('thinking');
    expect(s.userTurnCount).toBe(1);
    expect(s.turns[s.turns.length - 1]).toEqual({ role: 'user', text: 'hello' });
  });

  it('CLIENT_REPLY añade la respuesta del cliente y vuelve a prompting', () => {
    let s = roleplayReducer(start(), { type: 'USER_TURN', text: 'hi' });
    s = roleplayReducer(s, { type: 'CLIENT_REPLY', text: 'How can I help?' });
    expect(s.phase).toBe('prompting');
    expect(s.turns[s.turns.length - 1]).toEqual({ role: 'client', text: 'How can I help?' });
  });

  it('COMPLETE fija el resultado con los turnos usados', () => {
    let s = start();
    s = roleplayReducer(s, { type: 'USER_TURN', text: 'a' });
    s = roleplayReducer(s, { type: 'USER_TURN', text: 'b' });
    s = roleplayReducer(s, { type: 'USER_TURN', text: 'c' });
    s = roleplayReducer(s, {
      type: 'COMPLETE',
      objectiveMet: true,
      foundVocabulary: ['reservation', 'room'],
    });
    expect(s.phase).toBe('completed');
    expect(s.objectiveMet).toBe(true);
    expect(s.result).toMatchObject({ objectiveMet: true, turnsUsed: 3, maxTurns: 5 });
    expect(s.result?.foundVocabulary).toEqual(['reservation', 'room']);
  });

  it('FAIL pasa a error con mensaje', () => {
    const s = roleplayReducer(initialState, { type: 'FAIL', message: 'modelo no disponible' });
    expect(s.phase).toBe('error');
    expect(s.error).toBe('modelo no disponible');
  });

  it('RESET devuelve al estado inicial exacto', () => {
    const s = roleplayReducer(start(), { type: 'RESET' });
    expect(s).toEqual(initialState);
  });
});

describe('shouldComplete', () => {
  it('solo da por cumplido el objetivo tras el mínimo de turnos', () => {
    expect(
      shouldComplete({ objectiveMet: true, userTurnCount: 2, minTurns: 3, maxTurns: 5 }),
    ).toBe(false);
    expect(
      shouldComplete({ objectiveMet: true, userTurnCount: 3, minTurns: 3, maxTurns: 5 }),
    ).toBe(true);
  });

  it('corta siempre al llegar a maxTurns, incluso sin cumplir el objetivo', () => {
    expect(
      shouldComplete({ objectiveMet: false, userTurnCount: 5, minTurns: 3, maxTurns: 5 }),
    ).toBe(true);
  });

  it('no completa antes de tiempo con objetivo cumplido', () => {
    expect(
      shouldComplete({ objectiveMet: true, userTurnCount: 1, minTurns: 3, maxTurns: 5 }),
    ).toBe(false);
  });
});

describe('isTurnLimitReached', () => {
  it('detecta el límite de turnos', () => {
    expect(isTurnLimitReached(4, 5)).toBe(false);
    expect(isTurnLimitReached(5, 5)).toBe(true);
    expect(isTurnLimitReached(6, 5)).toBe(true);
  });
});