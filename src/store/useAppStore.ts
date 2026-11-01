import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { get, set, del } from "../db";
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
      storage: createJSONStorage(() => ({
        getItem: async (name) => {
          try {
            const raw = await get(name);
            if (!raw) return null;

            const stored = raw as any;
            // Contrato zustand persist: { state, version }. Los datos legacy (v0)
            // se guardaron planos, sin envoltorio.
            const isEnvelope =
              stored && typeof stored === 'object' && stored.state && typeof stored.state === 'object';
            const zustandVersion: number =
              isEnvelope && typeof stored.version === 'number' ? stored.version : 0;
            let data: any = isEnvelope ? stored.state : stored;

            // 1. Security snapshot + migración semántica si el estado es legacy (sin version de app)
            if (!data.version) {
              const { DataMigrator } = await import('../db/DataMigrator');
              await DataMigrator.ensureBackup(data);
              console.log('🔄 Migrando datos legacy a v1...');
              data = DataMigrator.migrate(data);
            }

            // 2. Validación Zod + reparación. Zod descarta claves desconocidas
            // (isPremium, licenseInfo, retos...), así que se conservan las originales.
            const { DataValidator } = await import('../db/DataValidator');
            const validated = DataValidator.validateAndRepair(data);
            const state = { ...data, ...validated };

            return JSON.stringify({ state, version: zustandVersion });
          } catch (err) {
            console.warn('[store] No se pudo leer de IndexedDB, usando estado por defecto:', err);
            return null;
          }
        },
        setItem: async (name, value) => {
          try {
            // value llega como string desde createJSONStorage; parseamos antes de guardar
            await set(name, JSON.parse(value));
          } catch (err) {
            console.warn('[store] No se pudo escribir en IndexedDB:', err);
          }
        },
        removeItem: async (name) => {
          try {
            await del(name);
          } catch (err) {
            console.warn('[store] No se pudo eliminar de IndexedDB:', err);
          }
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

