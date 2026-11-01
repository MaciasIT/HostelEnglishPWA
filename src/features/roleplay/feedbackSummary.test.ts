import { describe, it, expect } from 'vitest';
import { buildFeedbackSummary } from './feedbackSummary';
import { checkObjectiveAcrossTurns } from './goalChecker';
import { getScenario } from './scenarios';

describe('buildFeedbackSummary', () => {
  it('promedia la cortesía de los turnos y la etiqueta', () => {
    const checkin = getScenario('checkin')!;
    // Un turno neutro (60) y otro con una descortesía (40 → media 50).
    const goal = checkObjectiveAcrossTurns(checkin, [
      'Can I have the bill?',
      'I want a refund.',
    ]);
    const summary = buildFeedbackSummary({
      userTurns: ['Can I have the bill?', 'I want a refund.'],
      goal,
    });

    expect(summary.politenessScore).toBe(50);
    expect(summary.politenessLevel).toBe('mejorable');
  });

  it('refleja el vocabulario técnico utilizado y el pendiente', () => {
    const checkin = getScenario('checkin')!;
    const turns = ['Could I see your reservation and passport?'];
    const goal = checkObjectiveAcrossTurns(checkin, turns);

    const summary = buildFeedbackSummary({ userTurns: turns, goal });

    expect(summary.technicalVocabularyUsed).toEqual(
      expect.arrayContaining(['reservation', 'passport']),
    );
    expect(summary.missingVocabulary.length).toBeGreaterThan(0);
    expect(summary.objectiveMet).toBe(false);
  });

  it('lista en áreas de mejora las descortesías y el vocabulario pendiente', () => {
    const checkin = getScenario('checkin')!;
    const turns = ['Give me my room now.'];
    const goal = checkObjectiveAcrossTurns(checkin, turns);
    const summary = buildFeedbackSummary({ userTurns: turns, goal });

    expect(summary.areasToImprove.some((a) => a.includes('Could you please'))).toBe(true);
    expect(
      summary.areasToImprove.some((a) => a.includes('vocabulario técnico')),
    ).toBe(true);
  });

  it('destaca los puntos fuertes cuando usa cortesía y vocabulario', () => {
    const checkin = getScenario('checkin')!;
    const turns = ['Could you please check my reservation? Thank you.'];
    const goal = checkObjectiveAcrossTurns(checkin, turns);
    const summary = buildFeedbackSummary({ userTurns: turns, goal });

    expect(summary.strengths.some((s) => s.includes('could you'))).toBe(true);
    expect(summary.technicalVocabularyUsed).toContain('reservation');
  });

  it('evita duplicar la misma área de mejora entre turnos', () => {
    const checkin = getScenario('checkin')!;
    const turns = ['Give me the bill.', 'Give me the receipt.'];
    const goal = checkObjectiveAcrossTurns(checkin, turns);
    const summary = buildFeedbackSummary({ userTurns: turns, goal });

    const giveMeCount = summary.areasToImprove.filter((a) => a.includes('Give me')).length;
    expect(giveMeCount).toBe(1);
  });

  it('sin turnos de cortesía devuelve puntuación neutra 100 y sin mejoras', () => {
    const checkin = getScenario('checkin')!;
    const goal = checkObjectiveAcrossTurns(checkin, []);
    const summary = buildFeedbackSummary({ userTurns: [], goal });

    expect(summary.politenessScore).toBe(100);
    expect(summary.areasToImprove).toEqual(
      expect.arrayContaining([expect.stringContaining('vocabulario técnico')]),
    );
  });
});