import { describe, it, expect } from 'vitest';
import {
  evaluatePoliteness,
  courtesyLevelFor,
  COURTESY_LEVEL_LABELS,
} from './courtesyEvaluator';

describe('evaluatePoliteness', () => {
  it('detecta un imperativo directo "Give me..." y sugiere "Could you please..."', () => {
    const result = evaluatePoliteness('Give me the menu.');
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: 'give me',
          suggestion: 'Could you please…?',
        }),
      ]),
    );
    expect(result.politenessScore).toBeLessThan(50);
  });

  it('no confunde "Could you please give me..." con un imperativo', () => {
    const result = evaluatePoliteness('Could you please give me the menu?');
    expect(result.issues).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ label: 'give me' })]),
    );
    // Tiene "could you" y "please" como marcadores.
    expect(result.politeMarkers).toEqual(expect.arrayContaining(['could you', 'please']));
    expect(result.politenessScore).toBeGreaterThanOrEqual(80);
  });

  it('detecta "I want" y sugiere "I\'d like"', () => {
    const result = evaluatePoliteness('I want a refund now.');
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: 'I want', suggestion: "I'd like…" }),
      ]),
    );
  });

  it('reconoce marcadores positivos y sube la puntuación', () => {
    const result = evaluatePoliteness(
      'Thank you so much, could you please help me? I would like a room.',
    );
    expect(result.politeMarkers).toEqual(
      expect.arrayContaining(['thank you', 'could you', 'please', 'i would like']),
    );
    expect(result.politenessScore).toBeGreaterThanOrEqual(85);
    expect(result.level).toBe('excelente');
  });

  it('penaliza múltiples descortesías de forma acumulada', () => {
    // Tres frases, cada una con su descortesía detectable.
    const result = evaluatePoliteness('Give me my money. Hurry up. Shut up.');
    expect(result.issues.length).toBeGreaterThanOrEqual(3);
    expect(result.politenessScore).toBe(0);
    expect(result.level).toBe('descortés');
  });

  it('evalúa frase a frase, respetando los límites de puntuación', () => {
    // "Give me" abre la segunda frase tras el punto final y sí se detecta.
    const result = evaluatePoliteness('Hello, how are you? Give me the bill.');
    expect(result.issues).toEqual(
      expect.arrayContaining([expect.objectContaining({ label: 'give me' })]),
    );
  });

  it('una frase neutra sin marcadores ni problemas queda en nivel "buena"', () => {
    const result = evaluatePoliteness('Can I have the bill?');
    expect(result.politeMarkers).toHaveLength(0);
    expect(result.issues).toHaveLength(0);
    expect(result.politenessScore).toBe(60);
    expect(result.level).toBe('buena');
  });
});

describe('courtesyLevelFor', () => {
  it('mapea puntuaciones a los niveles correctos', () => {
    expect(courtesyLevelFor(100)).toBe('excelente');
    expect(courtesyLevelFor(90)).toBe('excelente');
    expect(courtesyLevelFor(85)).toBe('excelente');
    expect(courtesyLevelFor(70)).toBe('buena');
    expect(courtesyLevelFor(60)).toBe('buena');
    expect(courtesyLevelFor(50)).toBe('mejorable');
    expect(courtesyLevelFor(30)).toBe('mejorable');
    expect(courtesyLevelFor(10)).toBe('descortés');
    expect(courtesyLevelFor(0)).toBe('descortés');
  });
});

describe('COURTESY_LEVEL_LABELS', () => {
  it('expone etiquetas legibles para todos los niveles', () => {
    expect(COURTESY_LEVEL_LABELS).toEqual({
      excelente: 'Excelente',
      buena: 'Buena',
      mejorable: 'Mejorable',
      descortés: 'Descortés',
    });
  });
});