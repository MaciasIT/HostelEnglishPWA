import { StateCreator } from 'zustand';
import { AppPrefs } from '../types';

export interface PrefsSlice {
  prefs: AppPrefs;
  setTheme: (theme: string) => void;
  setAudioSpeed: (speed: number) => void;
  setTargetLanguage: (lang: 'en' | 'eu') => void;
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
    theme: "light",
    audioSpeed: 1,
    conversationSettings: {},
    phraseSettings: {
      voiceURI: '',
      rate: 1,
      pitch: 1,
    },
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
