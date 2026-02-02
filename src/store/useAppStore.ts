import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { get, set, del } from "../db";

export type Phrase = {
  id: number | string;
  es: string;
  en: string;
  eu?: string;
  categoria?: string;
};

export type ConversationTurn = {
  speaker: string;
  en: string;
  es: string;
  eu?: string;
  audio?: string;
};

export type Conversation = {
  id: number;
  title: string;
  description: string;
  dialogue: ConversationTurn[]; // Cambiado de turns a dialogue
  categoria?: string;
  participants: string[];
};

type State = {
  frases: Phrase[];
  conversations: Conversation[];
  categories: string[];
  frasesLoaded: boolean;
  conversationsLoaded: boolean;
  loadFrases: () => Promise<void>;
  loadConversations: () => Promise<void>;
  /** Progress tracking: Maps phrase ID to mastery level (0-3) */
  progress: Record<string, number>;
  prefs: {
    /** Learning target: English or Basque */
    targetLanguage: 'en' | 'eu';
    theme: string;
    audioSpeed: number;
    /**
     * Speech settings per participant in conversations.
     * Allows multi-voice simulation for roleplaying.
     */
    conversationSettings: {
      [participant: string]: {
        voiceURI: string;
        rate: number;
        pitch: number;
      };
    };
    /** Global preference for individual phrase playback */
    phraseSettings: {
      voiceURI: string;
      rate: number;
      pitch: number;
    };
  };
  /** Phrases currently active in a study session (Frases or Quiz) */
  activePhraseSet: Phrase[];
  /** UI State for the navigation sidebar */
  isSideNavOpen: boolean;
  /** Activity log: Maps ISO date string to points earned */
  dailyActivity: Record<string, number>;
  /** Historical exam performance */
  examHistory: Array<{ date: string; score: number; total: number }>;
  /** Unlocked badge IDs */
  achievements: string[];
};

type Actions = {
  initializeCategories: () => void;
  advancePhraseProgress: (phraseId: string) => void;
  setTheme: (theme: string) => void;
  setAudioSpeed: (speed: number) => void;
  setTargetLanguage: (lang: 'en' | 'eu') => void; // Added action
  /**
   * Sets a specific speech synthesis setting (voiceURI, rate, or pitch) for a given conversation participant.
   * This allows for differentiated voices and speech characteristics per role in conversations.
   * @param participant The name of the conversation participant.
   * @param setting The specific setting to update ('voiceURI', 'rate', or 'pitch').
   * @param value The new value for the setting.
   */
  setConversationParticipantSetting: (
    participant: string,
    setting: 'voiceURI' | 'rate' | 'pitch',
    value: string | number
  ) => void;
  setPhraseSetting: (
    setting: 'voiceURI' | 'rate' | 'pitch',
    value: string | number
  ) => void;
  /**
   * Sets the active phrase set to start a new study session.
   * @param phrases The array of phrases to be used for the study session.
   */
  setActivePhraseSet: (phrases: Phrase[]) => void;
  toggleSideNav: () => void;
  closeSideNav: () => void;
  recordActivity: () => void;
  recordExamResult: (score: number, total: number) => void;
};

export const useAppStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      frases: [],
      conversations: [],
      categories: ['Estudiadas', 'Aprendidas'],
      frasesLoaded: false,
      conversationsLoaded: false,
      progress: {},
      prefs: {
        targetLanguage: 'en', // Default to English
        theme: "light",
        audioSpeed: 1,
        conversationSettings: {}, // Initialize conversation settings as an empty object
        phraseSettings: {
          voiceURI: '',
          rate: 1,
          pitch: 1,
        },
      },
      isSideNavOpen: false,
      activePhraseSet: [],
      dailyActivity: {},
      examHistory: [],
      achievements: [],
      /**
       * Calculates unique categories by merging phrases and conversations data.
       * Injects system categories 'Estudiadas' and 'Aprendidas' for filtering.
       */
      initializeCategories: () => {
        const { frases, conversations } = get();
        const categoriesFromFrases = frases.map(f => f.categoria).filter(Boolean) as string[];
        const categoriesFromConvos = conversations.map(c => c.categoria).filter(Boolean) as string[];
        const allDataSetCategories = [...new Set([...categoriesFromFrases, ...categoriesFromConvos])];
        set({ categories: ['Estudiadas', 'Aprendidas', ...allDataSetCategories] });
      },
      loadFrases: async () => {
        if (get().frasesLoaded) return;
        try {
          const res = await fetch(`${import.meta.env.BASE_URL}data/hostelenglish_dataset_clean.json?v=${Date.now()}`);
          const data = await res.json();
          set({ frases: data.phrases || [], frasesLoaded: true });
          get().initializeCategories();
        } catch (e) {
          console.warn("No se pudo cargar el dataset de frases.", e);
        }
      },
      loadConversations: async () => {
        if (get().conversationsLoaded) return;
        try {
          const res = await fetch(`${import.meta.env.BASE_URL}data/conversations_extended_v4.json?v=${Date.now()}`);
          const data = await res.json();
          set({ conversations: data.conversations || [], conversationsLoaded: true });
          get().initializeCategories();
        } catch (e) {
          console.warn("No se pudo cargar el dataset de conversaciones.", e);
        }
      },
      /**
       * Increments the mastery level of a phrase.
       * Used across Quiz, Flashcards, and Frases to track learning progress.
       */
      advancePhraseProgress: (phraseId: string) => {
        const { recordActivity } = get();
        set((state) => {
          const currentLevel = state.progress[phraseId] || 0;
          if (currentLevel >= 3) return state; // Cap mastery level at 3
          return {
            progress: { ...state.progress, [phraseId]: currentLevel + 1 }
          };
        });
        recordActivity();
      },
      recordActivity: () => {
        const today = new Date().toISOString().split('T')[0];
        set((state) => ({
          dailyActivity: {
            ...state.dailyActivity,
            [today]: (state.dailyActivity[today] || 0) + 1,
          },
        }));
      },
      recordExamResult: (score, total) => {
        const today = new Date().toISOString().split('T')[0];
        const newResult = { date: today, score, total };

        set((state) => {
          const newHistory = [...state.examHistory, newResult];
          const newAchievements = [...state.achievements];

          // Achievement Logic
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
      },
      setTheme: (theme: string) => {
        set((state) => ({
          prefs: { ...state.prefs, theme },
        }));
      },
      setAudioSpeed: (speed: number) => {
        set((state) => ({
          prefs: { ...state.prefs, audioSpeed: speed },
        }));
      },
      setTargetLanguage: (lang: 'en' | 'eu') => {
        set((state) => ({
          prefs: { ...state.prefs, targetLanguage: lang },
        }));
      },
      setConversationParticipantSetting: (participant, setting, value) => {
        set((state) => ({
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
        }));
      },
      setPhraseSetting: (setting, value) => {
        set((state) => ({
          prefs: {
            ...state.prefs,
            phraseSettings: {
              ...state.prefs.phraseSettings,
              [setting]: value,
            },
          },
        }));
      },
      setActivePhraseSet: (phrases) => set({ activePhraseSet: phrases }),
      toggleSideNav: () => set((state) => ({ isSideNavOpen: !state.isSideNavOpen })),
      closeSideNav: () => set({ isSideNavOpen: false }),
    }),
    {
      name: "hostelenglish-storage",
      storage: createJSONStorage(() => ({
        getItem: async (name) => {
          const value = await get(name);
          return value ? JSON.stringify(value) : null;
        },
        setItem: async (name, value) => {
          await set(name, JSON.parse(value));
        },
        removeItem: async (name) => {
          await del(name);
        },
      })),
      partialize: (state) => ({
        progress: state.progress,
        prefs: state.prefs,
        dailyActivity: state.dailyActivity,
        examHistory: state.examHistory,
        achievements: state.achievements,
      }),
    }
  )
);
