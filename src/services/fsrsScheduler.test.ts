import { describe, it, expect } from 'vitest';
import {
  scheduleNextReview,
  computeRetrievability,
  migrateFromProgress,
  type ReviewItem,
  type Rating,
} from '@/services/fsrsScheduler';

function makeItem(overrides: Partial<ReviewItem> = {}): ReviewItem {
  return {
    id: 'phrase-1',
    dueDate: new Date('2026-11-01T10:00:00Z'),
    difficulty: 5,
    stability: 10,
    retrievability: 0.9,
    lapses: 0,
    reps: 1,
    state: 'review',
    ...overrides,
  };
}

describe('fsrsScheduler', () => {
  it('computes retrievability from stability and elapsed days', () => {
    expect(computeRetrievability(10, 0)).toBeCloseTo(1, 5);
    // FSRS retrievability after one stability period (S=10, elapsed=10) is ~0.9
    expect(computeRetrievability(10, 10)).toBeCloseTo(0.9, 1);
    expect(computeRetrievability(10, 90)).toBeGreaterThan(0);
  });

  it('returns a future due date after scheduling', () => {
    const item = makeItem();
    const now = new Date('2026-11-01T12:00:00Z');
    const result = scheduleNextReview(item, 'good', now);

    expect(result.nextDueDate.getTime()).toBeGreaterThan(now.getTime());
    expect(result.nextDifficulty).toBeGreaterThanOrEqual(1);
    expect(result.nextDifficulty).toBeLessThanOrEqual(10);
    expect(result.nextStability).toBeGreaterThan(0);
  });

  it('increases reps and preserves rating behavior', () => {
    const item = makeItem({ reps: 0, state: 'new' });
    const result = scheduleNextReview(item, 'good');

    expect(result.item.reps).toBe(1);
    expect(result.item.state).toBe('review');
  });

  it('increments lapses on again', () => {
    const item = makeItem({ lapses: 0 });
    const result = scheduleNextReview(item, 'again');

    expect(result.item.lapses).toBe(1);
    expect(result.item.state).toBe('relearning');
  });

  it('does not increment lapses on good/hard/easy', () => {
    const item = makeItem({ lapses: 1 });
    for (const rating of ['hard', 'good', 'easy'] as Rating[]) {
      const result = scheduleNextReview(item, rating);
      expect(result.item.lapses).toBe(1);
    }
  });

  it('generates coherent intervals for repeated reviews', () => {
    const now = new Date('2026-11-01T12:00:00Z');

    for (const rating of ['good', 'good', 'easy'] as Rating[]) {
      const item = makeItem({ reps: 0, state: 'new' });
      const result = scheduleNextReview(item, rating, now);
      expect(result.nextDueDate.getTime()).toBeGreaterThan(now.getTime());
    }
  });

  it('migrates level 3 to high stability review item', () => {
    const result = migrateFromProgress('p1', 3);
    expect(result.stability).toBe(21);
    expect(result.reps).toBe(3);
    expect(result.state).toBe('review');
  });

  it('migrates level 1 to learning item', () => {
    const result = migrateFromProgress('p1', 1);
    expect(result.state).toBe('learning');
    expect(result.reps).toBe(1);
  });

  it('migrates level 0 to new item', () => {
    const result = migrateFromProgress('p1', 0);
    expect(result.state).toBe('new');
    expect(result.reps).toBe(0);
  });
});
