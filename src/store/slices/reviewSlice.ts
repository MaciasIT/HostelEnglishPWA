import { StateCreator } from 'zustand';
import { Phrase } from '../types';
import { scheduleNextReview, type ReviewItem, type Rating, migrateFromProgress } from '@/services/fsrsScheduler';

export interface ReviewSlice {
  reviewItems: Record<string, ReviewItem>;
  duePhrases: Phrase[];
  getDuePhrases: (phrases: Phrase[]) => Phrase[];
  reviewPhrase: (phraseId: string, rating: Rating, phrases: Phrase[]) => Phrase | null;
  migrateLegacyProgress: (legacyProgress: Record<string, number>) => void;
}

function isDue(item: ReviewItem, today: string): boolean {
  const due = item.dueDate;
  const dueStr = due.toISOString().split('T')[0];
  return dueStr <= today;
}

export const createReviewSlice: StateCreator<ReviewSlice> = (set, get) => ({
  reviewItems: {},
  duePhrases: [],

  getDuePhrases: (phrases: Phrase[]) => {
    const today = new Date().toISOString().split('T')[0];
    const { reviewItems } = get();

    const due = phrases.filter((p) => {
      const item = reviewItems[String(p.id)];
      if (!item) return false;
      return isDue(item, today);
    });

    set({ duePhrases: due });
    return due;
  },

  reviewPhrase: (phraseId: string, rating: Rating, phrases: Phrase[]) => {
    const { reviewItems } = get();
    const existing = reviewItems[phraseId];

    if (!existing) {
      return null;
    }

    const result = scheduleNextReview(existing, rating);

    set((state) => ({
      reviewItems: {
        ...state.reviewItems,
        [phraseId]: result.item,
      },
      duePhrases: state.duePhrases.filter((p) => String(p.id) !== phraseId),
    }));

    const updated = phrases.find((p) => String(p.id) === phraseId) || null;
    return updated;
  },

  migrateLegacyProgress: (legacyProgress: Record<string, number>) => {
    const migrated: Record<string, ReviewItem> = {};

    for (const [phraseId, level] of Object.entries(legacyProgress)) {
      migrated[phraseId] = migrateFromProgress(phraseId, level as number);
    }

    set({ reviewItems: migrated });
  },
});
