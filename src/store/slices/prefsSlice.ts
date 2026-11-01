import { StateCreator } from 'zustand';
import { AppPrefs, ThemePreference, JobRole } from '../types';

export interface PrefsSlice {
  prefs: AppPrefs;
  setTheme: (theme: ThemePreference) => void;
  setAudioSpeed: (speed: number) => void;
  setTargetLanguage: (lang: 'en' | 'eu') => void;
  setPreferredRole: (role: 'bar' | 'recepcion' | 'restaurante' | 'mantenimiento' | 'limpieza') => void;
  setSelectedRole: (role: JobRole) => void;
  setStudentName: (name: string) => void;
  setConversationParticipantSetting: (
    participant: string,
    setting: 'voiceURI' | 'rate' | 'pitch',
    value: string | number
  ) => void;
  setPhraseSetting: (
    setting: 'voiceURI' | 'rate' | 'pitch',
    value: string | number
  ) => void;
}

export const createPrefsSlice: StateCreator<PrefsSlice> = (set) => ({
  prefs: {
    targetLanguage: 'en',
    theme: 'dark',
    audioSpeed: 1,
    conversationSettings: {},
    phraseSettings: {
      voiceURI: '',
      rate: 1,
      pitch: 1,
    },
    preferredRole: 'bar',
    selectedRole: null,
    studentName: '',
  },

  setTheme: (theme) => set((state) => ({
    prefs: { ...state.prefs, theme }
  })),

  setAudioSpeed: (speed) => set((state) => ({
    prefs: { ...state.prefs, audioSpeed: speed }
  })),

  setTargetLanguage: (lang) => set((state) => ({
    prefs: { ...state.prefs, targetLanguage: lang }
  })),

  setPreferredRole: (role) => set((state) => ({
    prefs: { ...state.prefs, preferredRole: role }
  })),

  setSelectedRole: (role) => set((state) => ({
    prefs: {
      ...state.prefs,
      selectedRole: role,
      // 'general' conserva el rol de retos previo (los retos no tienen plantilla general)
      preferredRole: role === 'general' ? state.prefs.preferredRole : role,
    }
  })),

  setStudentName: (name) => set((state) => ({
    prefs: { ...state.prefs, studentName: name }
  })),

  setConversationParticipantSetting: (participant, setting, value) => set((state) => ({
    prefs: {
      ...state.prefs,
      conversationSettings: {
        ...state.prefs.conversationSettings,
        [participant]: {
          ...(state.prefs.conversationSettings[participant] || { voiceURI: '', rate: 1, pitch: 1 }),
          [setting]: value,
        },
      },
    },
  })),

  setPhraseSetting: (setting, value) => set((state) => ({
    prefs: {
      ...state.prefs,
      phraseSettings: {
        ...state.prefs.phraseSettings,
        [setting]: value,
      },
    },
  })),
});
