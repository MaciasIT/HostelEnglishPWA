import { AppStateSchema, AppStateV1 } from '../models/schemas';

const initialState: AppStateV1 = {
  version: 1,
  progress: {},
  prefs: {
    targetLanguage: 'en',
    theme: 'light',
    audioSpeed: 1,
    conversationSettings: {},
    phraseSettings: {
      voiceURI: '',
      rate: 1,
      pitch: 1,
    },
  },
  dailyActivity: {},
  examHistory: [],
  achievements: [],
};

export class DataValidator {
  /**
   * Validates data with Zod and applies Soft Reset if it's partially broken.
   */
  static validateAndRepair(data: any): AppStateV1 {
    try {
      // Intento de validación profunda 
      return AppStateSchema.parse(data);
    } catch (e) {
      console.warn("⚠️ Error de validación Zod detectado. Intentando reparación (Soft Reset)...", e);
      
      const result = { ...initialState };

      // Rescatar progreso si es válido
      try {
        result.progress = AppStateSchema.shape.progress.parse(data.progress);
      } catch (per) { console.warn("Omitiendo progreso corrupto"); }

      // Rescatar preferencias si son válidas
      try {
        result.prefs = AppStateSchema.shape.prefs.parse(data.prefs);
      } catch (prer) { console.warn("Omitiendo preferencias corruptas"); }

      // Rescatar historial de exámenes si es válido
      try {
        result.examHistory = AppStateSchema.shape.examHistory.parse(data.examHistory);
      } catch (exer) { console.warn("Omitiendo historial corrupto"); }

      // Rescatar actividad diaria si es válida
      try {
        result.dailyActivity = AppStateSchema.shape.dailyActivity.parse(data.dailyActivity);
      } catch (dact) { console.warn("Omitiendo actividad diaria corrupta"); }

      // Rescatar logros si son válidos
      try {
        result.achievements = AppStateSchema.shape.achievements.parse(data.achievements);
      } catch (achr) { console.warn("Omitiendo logros corruptos"); }

      return result;
    }
  }
}
