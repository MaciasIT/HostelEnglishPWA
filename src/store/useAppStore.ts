import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { get, set, del } from "../db";
import { Phrase, Conversation, ConversationTurn, ExamResult, AppPrefs } from "./types";

// Slices
import { DataSlice, createDataSlice } from "./slices/dataSlice";
import { PrefsSlice, createPrefsSlice } from "./slices/prefsSlice";
import { ProgressSlice, createProgressSlice } from "./slices/progressSlice";
import { UISlice, createUISlice } from "./slices/uiSlice";

/** 
 * Unified application state type combining all slices 
 */
export type AppState = DataSlice & PrefsSlice & ProgressSlice & UISlice & {
  version: number;
};

// Re-export types for convenience
export type { Phrase, Conversation, ConversationTurn, ExamResult, AppPrefs };

export const useAppStore = create<AppState>()(
  persist(
    (...a) => ({
      version: 1,
      ...createDataSlice(...a),
      ...createPrefsSlice(...a),
      ...createProgressSlice(...a),
      ...createUISlice(...a),
    }),
    {
      name: "hostelenglish-storage",
      storage: createJSONStorage(() => ({
        getItem: async (name) => {
          const raw = await get(name);
          if (!raw) return null;

          let data = raw as any;

          // 1. Security snapshot if legacy (v0)
          if (!data.version) {
            const { DataMigrator } = await import('../db/DataMigrator');
            await DataMigrator.ensureBackup(data);
            
            // 2. Semantic Migration
            console.log('🔄 Migrando datos legacy a v1...');
            data = DataMigrator.migrate(data);
          }

          // 3. Zod Validation (Shielding) and Soft Repair
          const { DataValidator } = await import('../db/DataValidator');
          const validatedData = DataValidator.validateAndRepair(data);

          return JSON.stringify(validatedData);
        },
        setItem: async (name, value) => {
          await set(name, JSON.parse(value));
        },
        removeItem: async (name) => {
          await del(name);
        },
      })),
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
      }),
    }
  )
);

