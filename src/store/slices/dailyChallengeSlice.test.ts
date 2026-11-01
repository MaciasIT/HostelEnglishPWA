import { describe, it, expect, beforeEach, vi } from 'vitest';
import { create } from 'zustand';
import { createDailyChallengeSlice, type DailyChallengeSlice } from '@/store/slices/dailyChallengeSlice';
import type { PreferredRole, DailyChallenge } from '@/store/types';

// Mock para buildDailyChallenge para tests controlados
vi.mock('@/services/dailyChallengeService', async () => {
  const actual = await vi.importActual<typeof import('@/services/dailyChallengeService')>(
    '@/services/dailyChallengeService'
  );

  const makeChallenge = (date: string, role: string, title: string): DailyChallenge => ({
    id: `${date}-${title.toLowerCase().replace(/\s/g, '-')}`,
    date,
    role: role as PreferredRole,
    title,
    description: `Descripción de ${title}`,
    steps: [
      { id: 's1', description: 'Paso 1', completed: false },
      { id: 's2', description: 'Paso 2', completed: false },
    ],
    xpReward: 30,
    streakReward: 5,
    completed: false,
    claimed: false,
  });

  return {
    ...actual,
    buildDailyChallenge: vi.fn((date: string, role: string) =>
      makeChallenge(date, role, role === 'bar' ? 'Bar Test' : 'Rest Test')
    ),
  };
});

const buildStore = () =>
  create<DailyChallengeSlice>()((...a) => ({
    ...createDailyChallengeSlice(...a),
  }));

describe('dailyChallengeSlice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with null currentChallenge', () => {
    const store = buildStore();
    expect(store.getState().currentChallenge).toBeNull();
    expect(store.getState().lastChallengeDate).toBe('');
  });

  it('ensureDailyChallenge generates a challenge when none exists', () => {
    const store = buildStore();
    store.getState().ensureDailyChallenge('bar');
    const challenge = store.getState().currentChallenge;
    expect(challenge).not.toBeNull();
    expect(challenge!.role).toBe('bar');
    expect(challenge!.steps).toHaveLength(2);
    expect(challenge!.completed).toBe(false);
  });

  it('ensureDailyChallenge does not regenerate if already today', () => {
    const store = buildStore();
    store.getState().ensureDailyChallenge('bar');
    const first = store.getState().currentChallenge!;
    store.getState().ensureDailyChallenge('bar');
    expect(store.getState().currentChallenge).toBe(first);
  });

  it('completeStep marks a step as complete', () => {
    const store = buildStore();
    store.getState().ensureDailyChallenge('bar');
    const challenge = store.getState().currentChallenge!;
    expect(challenge.steps[0].completed).toBe(false);

    store.getState().completeStep(challenge.steps[0].id);

    expect(store.getState().currentChallenge!.steps[0].completed).toBe(true);
    expect(store.getState().currentChallenge!.completed).toBe(false); // not all done yet
  });

  it('completeStep marks challenge completed when all steps are done', () => {
    const store = buildStore();
    store.getState().ensureDailyChallenge('bar');
    const challenge = store.getState().currentChallenge!;

    store.getState().completeStep(challenge.steps[0].id);
    store.getState().completeStep(challenge.steps[1].id);

    expect(store.getState().currentChallenge!.completed).toBe(true);
  });

  it('completeStep does nothing if challenge is already completed', () => {
    const store = buildStore();
    store.getState().ensureDailyChallenge('bar');
    const challenge = store.getState().currentChallenge!;

    // Complete all steps
    challenge.steps.forEach((s) => store.getState().completeStep(s.id));
    expect(store.getState().currentChallenge!.completed).toBe(true);

    // Try to complete again
    store.getState().completeStep(challenge.steps[0].id);
    // No crash, still completed
    expect(store.getState().currentChallenge!.completed).toBe(true);
  });

  it('claimReward returns xp and streak when challenge is completed and unclaimed', () => {
    const store = buildStore();
    store.getState().ensureDailyChallenge('bar');
    const challenge = store.getState().currentChallenge!;

    // Complete all steps first
    challenge.steps.forEach((s) => store.getState().completeStep(s.id));

    const reward = store.getState().claimReward();
    expect(reward).not.toBeNull();
    expect(reward!.xp).toBe(30);
    expect(reward!.streak).toBe(5);

    expect(store.getState().currentChallenge!.claimed).toBe(true);
  });

  it('claimReward returns null if challenge not completed', () => {
    const store = buildStore();
    store.getState().ensureDailyChallenge('bar');
    expect(store.getState().claimReward()).toBeNull();
  });

  it('claimReward returns null if already claimed', () => {
    const store = buildStore();
    store.getState().ensureDailyChallenge('bar');
    const challenge = store.getState().currentChallenge!;
    challenge.steps.forEach((s) => store.getState().completeStep(s.id));

    store.getState().claimReward();
    expect(store.getState().claimReward()).toBeNull();
  });

  it('ensureDailyChallenge resets challenge when date changes', () => {
    const store = buildStore();

    // Simulate having a challenge from yesterday
    const yesterday = '2026-10-31';
    store.setState({
      currentChallenge: {
        id: `${yesterday}-bar-test`,
        date: yesterday,
        role: 'bar',
        title: 'Bar Test',
        description: '',
        steps: [{ id: 's1', description: 'A', completed: true }],
        xpReward: 10,
        streakReward: 2,
        completed: true,
        claimed: true,
      },
      lastChallengeDate: yesterday,
    });

    // Now ensure for today
    const todaySpy = vi.spyOn(Date.prototype, 'toISOString').mockReturnValue('2026-11-01T10:00:00.000Z');
    store.getState().ensureDailyChallenge('bar');
    todaySpy.mockRestore();

    const newChallenge = store.getState().currentChallenge!;
    expect(newChallenge.date).toBe('2026-11-01');
    expect(newChallenge.completed).toBe(false);
    expect(newChallenge.claimed).toBe(false);
  });
});
