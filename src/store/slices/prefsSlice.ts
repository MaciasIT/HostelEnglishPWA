import { StateCreator } from 'zustand';
import { AppPrefs, ThemePreference } from '../types';

export interface PrefsSlice {
  prefs: AppPrefs;
  setTheme: (theme: ThemePreference) => void;
  setAudioSpeed: (speed: number) => void;
  setTargetLanguage: (lang: 'en' | 'eu') => void;
  setPreferredRole: (role: 'bar' | 'recepcion' | 'restaurante' | 'mantenimiento' | 'limpieza') => void;
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
