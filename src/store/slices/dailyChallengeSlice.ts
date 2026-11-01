import { StateCreator } from 'zustand';
import type { DailyChallenge, PreferredRole } from '@/store/types';
import { buildDailyChallenge } from '@/services/dailyChallengeService';

export interface DailyChallengeSlice {
  currentChallenge: DailyChallenge | null;
  lastChallengeDate: string;

  /** Asegura que el reto del día está cargado. Si la fecha cambió, genera uno nuevo. */
  ensureDailyChallenge: (role: PreferredRole) => void;

  /** Marca un paso como completado. Si todos los pasos están completos, marca el reto como conseguido. */
  completeStep: (stepId: string) => void;

  /** Marca el reto como reclamado y suma XP + racha al progreso global. */
  claimReward: () => { xp: number; streak: number } | null;
}

export const createDailyChallengeSlice: StateCreator<DailyChallengeSlice> = (set, get) => ({
  currentChallenge: null,
  lastChallengeDate: '',

  ensureDailyChallenge: (role) => {
    const today = new Date().toISOString().split('T')[0];
    const { lastChallengeDate, currentChallenge } = get();

    // Si ya tenemos un reto para hoy, no hacemos nada
    if (currentChallenge && lastChallengeDate === today && currentChallenge.date === today) {
      return;
    }

    // Si el reto anterior es de ayer o anterior, lo reseteamos
    const newChallenge = buildDailyChallenge(today, role);

    set({
      currentChallenge: newChallenge,
      lastChallengeDate: today,
    });
  },

  completeStep: (stepId) => {
    const { currentChallenge } = get();

    if (!currentChallenge || currentChallenge.completed) return;

    const updatedSteps = currentChallenge.steps.map((s) =>
      s.id === stepId ? { ...s, completed: true } : s
    );

    const allCompleted = updatedSteps.every((s) => s.completed);

    set({
      currentChallenge: {
        ...currentChallenge,
        steps: updatedSteps,
        completed: allCompleted,
      },
    });
  },

  claimReward: () => {
    const { currentChallenge } = get();

    if (!currentChallenge || !currentChallenge.completed || currentChallenge.claimed) {
      return null;
    }

    const xp = currentChallenge.xpReward;
    const streak = currentChallenge.streakReward;

    set({
      currentChallenge: {
        ...currentChallenge,
        claimed: true,
      },
    });

    return { xp, streak };
  },
});
