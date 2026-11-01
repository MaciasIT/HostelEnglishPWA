import { describe, it, expect } from 'vitest';
import { buildHint, INACTIVITY_HINT_THRESHOLD_MS } from './hintService';
import { getScenario } from './scenarios';

describe('INACTIVITY_HINT_THRESHOLD_MS', () => {
  it('establece el umbral de inactividad en 8 segundos', () => {
    expect(INACTIVITY_HINT_THRESHOLD_MS).toBe(8000);
  });
});

describe('buildHint', () => {
  it('prioriza el vocabulario pendiente del escenario', () => {
    const checkin = getScenario('checkin')!;
    const hint = buildHint(checkin, []);

    expect(hint.keywords.length).toBeGreaterThan(0);
    expect(hint.keywords.length).toBeLessThanOrEqual(3);
    // Sin turnos previos, todo el vocabulario está pendiente: la primera
    // palabra clave del escenario debe aparecer entre las sugeridas.
    expect(hint.keywords).toContain(checkin.expectedVocabulary[0]);
    // La frase es una oración cortés en inglés.
    expect(hint.phrase).toMatch(/could you|may i/i);
  });

  it('genera una frase cortés que integra la primera palabra pendiente', () => {
    const checkin = getScenario('checkin')!;
    const hint = buildHint(checkin, []);
    const firstMissing = checkin.expectedVocabulary[0];
    expect(hint.phrase.toLowerCase()).toContain(firstMissing.toLowerCase());
  });

  it('reduce el abanico de palabras clave conforme el alumno avanza', () => {
    const checkin = getScenario('checkin')!;
    // El alumno ya ha usado los dos primeros términos.
    const used = checkin.expectedVocabulary.slice(0, 2);
    const hint = buildHint(checkin, [`I checked your ${used[0]}.`, `Your ${used[1]} is here.`]);

    for (const term of used) {
      expect(hint.keywords).not.toContain(term);
    }
    expect(hint.keywords.length).toBeGreaterThan(0);
  });

  it('devuelve una pista genérica de ánimo cuando ya no falta vocabulario', () => {
    const checkin = getScenario('checkin')!;
    const allVocab = checkin.expectedVocabulary.join(' ');
    const hint = buildHint(checkin, [allVocab]);

    expect(hint.keywords).toHaveLength(0);
    expect(hint.phrase).toMatch(/doing well|could you/i);
  });

  it('es determinista: misma entrada, misma salida', () => {
    const bar = getScenario('bar')!;
    const a = buildHint(bar, ['I recommend a local cocktail.']);
    const b = buildHint(bar, ['I recommend a local cocktail.']);
    expect(a).toEqual(b);
  });
});