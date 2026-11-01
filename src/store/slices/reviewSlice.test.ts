import { describe, it, expect, beforeEach, vi } from 'vitest';
import { create } from 'zustand';
import { createReviewSlice, type ReviewSlice } from '@/store/slices/reviewSlice';
import type { Phrase } from '@/store/types';

const makePhrase = (id: number | string): Phrase => ({
  id,
  es: 'hola',
  en: 'hello',
  categoria: 'Saludos',
});

const buildStore = () =>
  create<ReviewSlice>()((...a) => ({
    ...createReviewSlice(...a),
  }));

describe('reviewSlice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with empty reviewItems and duePhrases', () => {
    const store = buildStore();
    expect(store.getState().reviewItems).toEqual({});
    expect(store.getState().duePhrases).toEqual([]);
  });

  it('getDuePhrases returns only phrases with due items', () => {
    const store = buildStore();
    store.setState({
      reviewItems: {
        '1': {
          id: '1',
          dueDate: new Date('2026-11-01T10:00:00Z'),
          difficulty: 5,
          stability: 10,
          retrievability: 0.9,
          lapses: 0,
          reps: 1,
          state: 'review',
        },
        '2': {
          id: '2',
          dueDate: new Date('2099-01-01T10:00:00Z'),
          difficulty: 5,
          stability: 10,
          retrievability: 0.9,
          lapses: 0,
          reps: 1,
          state: 'review',
        },
      },
    });

    const phrases = [makePhrase(1), makePhrase(2)];
    const due = store.getState().getDuePhrases(phrases);

    expect(due).toHaveLength(1);
    expect(due[0].id).toBe(1);
  });

  it('reviewPhrase updates reviewItems and removes from duePhrases', () => {
    const store = buildStore();
    const item = {
      id: '1',
      dueDate: new Date('2026-11-01T10:00:00Z'),
      difficulty: 5,
      stability: 10,
      retrievability: 0.9,
      lapses: 0,
      reps: 1,
      state: 'review' as const,
    };

    store.setState({ reviewItems: { '1': item }, duePhrases: [makePhrase(1)] });
    const phrases = [makePhrase(1)];

    const updated = store.getState().reviewPhrase('1', 'good', phrases);

    expect(updated).not.toBeNull();
    expect(store.getState().duePhrases).toHaveLength(0);
    expect(store.getState().reviewItems['1'].reps).toBe(2);
  });

  it('reviewPhrase returns null for unknown phrase', () => {
    const store = buildStore();
    const result = store.getState().reviewPhrase('unknown', 'good', []);
    expect(result).toBeNull();
  });

  it('migrateLegacyProgress converts old progress levels', () => {
    const store = buildStore();
    store.getState().migrateLegacyProgress({ '1': 3, '2': 0 });

    expect(store.getState().reviewItems['1'].stability).toBe(21);
    expect(store.getState().reviewItems['2'].reps).toBe(0);
  });
});
