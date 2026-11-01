import { StateCreator } from 'zustand';
import { ExamResult } from '../types';
import { queueProgressEvent, type ProgressEvent } from '@/services/syncService';

export interface ProgressSlice {
  progress: Record<string, number>;
  dailyActivity: Record<string, number>;
  examHistory: ExamResult[];
  achievements: string[];
  advancePhraseProgress: (phraseId: string) => void;
  recordActivity: () => void;
  recordExamResult: (score: number, total: number) => void;
}

export const createProgressSlice: StateCreator<ProgressSlice> = (set, get) => ({
  progress: {},
  dailyActivity: {},
  examHistory: [],
  achievements: [],

  advancePhraseProgress: (phraseId: string) => {
    set((state) => {
      const currentLevel = state.progress[phraseId] || 0;
      if (currentLevel >= 3) return state;
      return {
        progress: { ...state.progress, [phraseId]: currentLevel + 1 }
      };
    });
    get().recordActivity();
    const evt: ProgressEvent = { type: 'advance_phrase', payload: { phraseId } };
    queueProgressEvent(evt).catch(() => {});
  },

  recordActivity: () => {
    const today = new Date().toISOString().split('T')[0];
    set((state) => ({
      dailyActivity: {
        ...state.dailyActivity,
        [today]: (state.dailyActivity[today] || 0) + 1,
      },
    }));
    const evt: ProgressEvent = { type: 'record_activity', payload: { date: today } };
    queueProgressEvent(evt).catch(() => {});
  },

  recordExamResult: (score: number, total: number) => {
    const today = new Date().toISOString().split('T')[0];
    const newResult = { date: today, score, total };

    set((state) => {
      const newHistory = [...state.examHistory, newResult];
      const newAchievements = [...state.achievements];

      if (newHistory.length === 1 && !newAchievements.includes('first_exam')) {
        newAchievements.push('first_exam');
      }
      if (score === total && total >= 10 && !newAchievements.includes('perfect_score')) {
        newAchievements.push('perfect_score');
      }
      if (newHistory.filter(h => h.score >= h.total * 0.8).length >= 5 && !newAchievements.includes('exam_master')) {
        newAchievements.push('exam_master');
      }

      return {
        examHistory: newHistory,
        achievements: newAchievements,
      };
    });
    const evt: ProgressEvent = { type: 'record_exam', payload: { score, total } };
    queueProgressEvent(evt).catch(() => {});
  },
});
