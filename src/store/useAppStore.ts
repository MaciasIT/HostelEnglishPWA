import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { persistStorage } from "./persistStorage";
import { Phrase, Conversation, ConversationTurn, ExamResult, AppPrefs } from "./types";
import { useShallow } from "zustand/react/shallow";

// Slices
import { DataSlice, createDataSlice } from "./slices/dataSlice";
import { PrefsSlice, createPrefsSlice } from "./slices/prefsSlice";
import { ProgressSlice, createProgressSlice } from "./slices/progressSlice";
import { UISlice, createUISlice } from "./slices/uiSlice";
import { LicenseSlice, createLicenseSlice } from "./slices/licenseSlice";
import { ReviewSlice, createReviewSlice } from "./slices/reviewSlice";
import { DailyChallengeSlice, createDailyChallengeSlice } from "./slices/dailyChallengeSlice";

/**
 * Unified application state type combining all slices
 */
export type AppState = DataSlice & PrefsSlice & ProgressSlice & UISlice & LicenseSlice & ReviewSlice & DailyChallengeSlice & {
  version: number;
};

// Re-export types and shallow selector helper for convenience
export type { Phrase, Conversation, ConversationTurn, ExamResult, AppPrefs };
export { useShallow };

export const useAppStore = create<AppState>()(
  persist(
    (...a) => ({
      version: 1,
      ...createDataSlice(...a),
      ...createPrefsSlice(...a),
      ...createProgressSlice(...a),
      ...createUISlice(...a),
      ...createLicenseSlice(...a),
      ...createReviewSlice(...a),
      ...createDailyChallengeSlice(...a),
    }),
    {
      name: "hostelenglish-storage",
      version: 0, // versión de zustand persist (distinta de state.version de la app)
      migrate: (persisted) => persisted as AppState,
      storage: createJSONStorage(persistStorage),
      /**
       * Specifies which parts of the state should be persisted in IndexedDB.
       * Large datasets (frases, conversations) are NOT persisted as they are loaded from JSON.
       */
      partialize: (state) => ({
        version: state.version,
        progress: state.progress,
        prefs: state.prefs,
        dailyActivity: state.dailyActivity,
        examHistory: state.examHistory,
        achievements: state.achievements,
        isSideNavCollapsed: state.isSideNavCollapsed,
        isPremium: state.isPremium,
        licenseInfo: state.licenseInfo,
        reviewItems: state.reviewItems,
        currentChallenge: state.currentChallenge,
        lastChallengeDate: state.lastChallengeDate,
        certifications: state.certifications,
      }),
    }
  )
);

