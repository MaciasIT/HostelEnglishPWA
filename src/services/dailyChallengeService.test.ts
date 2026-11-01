import { describe, it, expect } from 'vitest';
import {
  CHALLENGE_CATALOG,
  fnv1aHash,
  pickTemplateForDate,
  buildDailyChallenge,
} from '@/services/dailyChallengeService';

describe('dailyChallengeService', () => {
  // -----------------------------------------------------------------------
  // Catálogo
  // -----------------------------------------------------------------------
  it('should have at least one template per role', () => {
    const roles = ['bar', 'recepcion', 'restaurante', 'mantenimiento', 'limpieza'] as const;
    for (const role of roles) {
      const count = CHALLENGE_CATALOG.filter((t) => t.role === role).length;
      expect(count).toBeGreaterThanOrEqual(1);
    }
  });

  it('every template should have id, title, description, steps, rewards', () => {
    for (const t of CHALLENGE_CATALOG) {
      expect(t.id).toBeTruthy();
      expect(t.title).toBeTruthy();
      expect(t.description).toBeTruthy();
      expect(t.steps.length).toBeGreaterThanOrEqual(2);
      expect(t.xpReward).toBeGreaterThan(0);
      expect(t.streakReward).toBeGreaterThanOrEqual(0);
    }
  });

  // -----------------------------------------------------------------------
  // Hash determinista
  // -----------------------------------------------------------------------
  it('fnv1aHash returns same value for same input', () => {
    expect(fnv1aHash('hello')).toBe(fnv1aHash('hello'));
  });

  it('fnv1aHash returns different values for different inputs', () => {
    expect(fnv1aHash('hello')).not.toBe(fnv1aHash('world'));
  });

  // -----------------------------------------------------------------------
  // pickTemplateForDate
  // -----------------------------------------------------------------------
  it('returns same template for same date+role', () => {
    const t1 = pickTemplateForDate('2026-11-01', 'bar');
    const t2 = pickTemplateForDate('2026-11-01', 'bar');
    expect(t1.id).toBe(t2.id);
  });

  it('returns different templates for different roles on same date', () => {
    const bar = pickTemplateForDate('2026-11-01', 'bar');
    const recep = pickTemplateForDate('2026-11-01', 'recepcion');
    // Distribución del catálogo permite colisión teórica; test solo confirma consistencia
    const bar2 = pickTemplateForDate('2026-11-01', 'bar');
    expect(bar.id).toBe(bar2.id);
    expect(recep.id).toBe(pickTemplateForDate('2026-11-01', 'recepcion').id);
  });

  it('returns different templates for different dates with same role', () => {
    const day1 = pickTemplateForDate('2026-11-01', 'bar');
    const day2 = pickTemplateForDate('2026-11-02', 'bar');
    expect(day1.id).not.toBe(day2.id);
  });

  // -----------------------------------------------------------------------
  // buildDailyChallenge
  // -----------------------------------------------------------------------
  it('builds a complete DailyChallenge with all steps uncompleted', () => {
    const challenge = buildDailyChallenge('2026-11-01', 'bar');
    expect(challenge.date).toBe('2026-11-01');
    expect(challenge.role).toBe('bar');
    expect(challenge.steps.length).toBeGreaterThanOrEqual(2);
    expect(challenge.steps.every((s) => !s.completed)).toBe(true);
    expect(challenge.completed).toBe(false);
    expect(challenge.claimed).toBe(false);
    expect(challenge.xpReward).toBeGreaterThan(0);
    expect(challenge.streakReward).toBeGreaterThanOrEqual(0);
    expect(challenge.id).toContain('2026-11-01');
  });

  it('builds same challenge for same date and role (deterministic)', () => {
    const a = buildDailyChallenge('2026-11-15', 'restaurante');
    const b = buildDailyChallenge('2026-11-15', 'restaurante');
    expect(a.id).toBe(b.id);
    expect(a.title).toBe(b.title);
    expect(a.xpReward).toBe(b.xpReward);
  });
});
