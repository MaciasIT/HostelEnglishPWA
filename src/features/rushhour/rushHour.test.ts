import { describe, it, expect } from 'vitest';

import {
  remainingMs,
  rushHourGrade,
  RUSH_HOUR_BUDGET_PER_SITUATION_MS,
  RUSH_HOUR_SITUATIONS,
  RUSH_HOUR_TIME_LIMIT_MS,
  RUSH_HOUR_TOTAL_SITUATIONS,
  scoreRushHourAnswer,
  speedScoreFor,
  summarizeRushHour,
} from './rushHour';

describe('RUSH_HOUR_SITUATIONS', () => {
  it('deriva exactamente 5 situaciones de los escenarios canónicos', () => {
    expect(RUSH_HOUR_SITUATIONS).toHaveLength(RUSH_HOUR_TOTAL_SITUATIONS);
    expect(RUSH_HOUR_TOTAL_SITUATIONS).toBe(5);
    expect(RUSH_HOUR_TIME_LIMIT_MS).toBe(2 * 60 * 1000);
  });

  it('cada situación tiene instrucción y línea de cliente no vacías', () => {
    for (const s of RUSH_HOUR_SITUATIONS) {
      expect(s.id).toBeTruthy();
      expect(s.instruction.length).toBeGreaterThan(5);
      expect(s.prompt.length).toBeGreaterThan(5);
      expect(s.departmentLabel).toBeTruthy();
    }
  });

  it('el presupuesto por comanda reparte los 2 minutos entre 5', () => {
    expect(RUSH_HOUR_BUDGET_PER_SITUATION_MS).toBe(24_000);
  });
});

describe('remainingMs', () => {
  it('devuelve la diferencia y la acota por debajo a 0', () => {
    expect(remainingMs(1000, 0)).toBe(1000);
    expect(remainingMs(1000, 600)).toBe(400);
    expect(remainingMs(1000, 2000)).toBe(0);
  });
});

describe('speedScoreFor', () => {
  it('otorga 100 dentro del tramo ideal (≤ 10 s)', () => {
    expect(speedScoreFor(0)).toBe(100);
    expect(speedScoreFor(10_000)).toBe(100);
    expect(speedScoreFor(10_001)).toBeLessThanOrEqual(100);
  });

  it('decae linealmente hasta 0 en el presupuesto completo', () => {
    expect(speedScoreFor(24_000)).toBe(0);
    const halfBudget = 10_000 + (24_000 - 10_000) / 2; // 17 s → ~50
    expect(speedScoreFor(halfBudget)).toBe(50);
  });

  it('no se sale del rango 0–100', () => {
    expect(speedScoreFor(999_999)).toBe(0);
    expect(speedScoreFor(100)).toBe(100);
  });
});

describe('scoreRushHourAnswer', () => {
  it('combina velocidad y cortesía al 50 %', () => {
    const fast = scoreRushHourAnswer({
      situationId: 'checkin',
      elapsedMs: 5_000,
      text: 'Certainly, may I see your passport and I will find your booking right away.',
    });
    expect(fast.speedScore).toBe(100);
    expect(fast.courtesyScore).toBeGreaterThanOrEqual(55);
    expect(fast.combinedScore).toBe(Math.round(0.5 * fast.speedScore + 0.5 * fast.courtesyScore));
  });

  it('penaliza la cortesía descortés aunque la respuesta sea rápida', () => {
    const rude = scoreRushHourAnswer({ situationId: 'bar', elapsedMs: 3_000, text: 'Give me that.' });
    expect(rude.speedScore).toBe(100);
    expect(rude.courtesyScore).toBeLessThan(55);
    expect(rude.combinedScore).toBeLessThan(100);
  });

  it('respuesta vacía produce cortesía baja', () => {
    const empty = scoreRushHourAnswer({ situationId: 'complaint', elapsedMs: 1_000, text: '' });
    expect(empty.courtesyScore).toBeLessThan(55);
  });
});

describe('summarizeRushHour', () => {
  it('promedia velocidad, cortesía y combinada, y detecta ronda incompleta', () => {
    const scores = [
      scoreRushHourAnswer({ situationId: 'checkin', elapsedMs: 5_000, text: 'May I see your passport, please?' }),
      scoreRushHourAnswer({ situationId: 'bar', elapsedMs: 30_000, text: 'I want a drink now.' }),
    ];
    const summary = summarizeRushHour(scores);
    expect(summary.answeredCount).toBe(2);
    expect(summary.totalCount).toBe(RUSH_HOUR_TOTAL_SITUATIONS);
    expect(summary.completed).toBe(false);
    expect(summary.averageCombined).toBe(
      Math.round((scores[0].combinedScore + scores[1].combinedScore) / 2),
    );
  });

  it('marca completed solo al responder las 5', () => {
    const full = RUSH_HOUR_SITUATIONS.map((s, i) =>
      scoreRushHourAnswer({ situationId: s.id, elapsedMs: 8_000 + i, text: 'Of course, let me help you with that.' }),
    );
    expect(summarizeRushHour(full).completed).toBe(true);
  });

  it('devuelve medias 0 con lista vacía', () => {
    const summary = summarizeRushHour([]);
    expect(summary.averageCombined).toBe(0);
    expect(summary.averageSpeed).toBe(0);
    expect(summary.averageCourtesy).toBe(0);
  });
});

describe('rushHourGrade', () => {
  it('clasifica según umbrales', () => {
    expect(rushHourGrade(90)).toBe('Excelente');
    expect(rushHourGrade(70)).toBe('Buen trabajo');
    expect(rushHourGrade(40)).toBe('Mejorable');
    expect(rushHourGrade(10)).toBe('Necesitas práctica');
  });
});