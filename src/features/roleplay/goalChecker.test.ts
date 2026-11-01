import { describe, it, expect } from 'vitest';
import { checkObjective, checkObjectiveAcrossTurns } from './goalChecker';
import { getScenario } from './scenarios';

describe('checkObjective', () => {
  const checkin = getScenario('checkin')!;

  it('cumple el objetivo cuando aparece el vocabulario clave', () => {
    const result = checkObjective(
      checkin,
      "I'm sorry. Let me check your reservation and passport. We have a room available tonight.",
    );
    expect(result.met).toBe(true);
    expect(result.hits).toBeGreaterThanOrEqual(3);
    expect(result.foundVocabulary).toEqual(
      expect.arrayContaining(['reservation', 'passport', 'room']),
    );
  });

  it('no cumple el objetivo con una respuesta genérica', () => {
    const result = checkObjective(checkin, 'Hello, how are you today?');
    expect(result.met).toBe(false);
    expect(result.hits).toBeLessThan(3);
    expect(result.missingVocabulary.length).toBeGreaterThan(0);
  });

  it('normaliza mayúsculas y puntuación', () => {
    const restaurant = getScenario('restaurant')!;
    const result = checkObjective(
      restaurant,
      'We have GLUTEN-free dishes and NO nuts; let me recommend something SAFE.',
    );
    expect(result.met).toBe(true);
    expect(result.foundVocabulary).toEqual(expect.arrayContaining(['gluten', 'nuts', 'safe']));
  });

  it('detecta frases compuestas de varias palabras', () => {
    const maintenance = getScenario('maintenance')!;
    const result = checkObjective(
      maintenance,
      'The air conditioning unit is leaking water. I will call a technician to fix it.',
    );
    expect(result.foundVocabulary).toEqual(
      expect.arrayContaining(['air conditioning', 'water', 'technician', 'fix']),
    );
  });
});

describe('checkObjectiveAcrossTurns', () => {
  it('acumula vocabulario distribuido entre varios turnos', () => {
    const checkin = getScenario('checkin')!;
    const result = checkObjectiveAcrossTurns(checkin, [
      'Could I see your passport?',
      'Let me check the reservation.',
      'We have a room available.',
    ]);
    expect(result.met).toBe(true);
    expect(result.foundVocabulary).toEqual(
      expect.arrayContaining(['passport', 'reservation', 'room']),
    );
  });
});