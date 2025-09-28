import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { get, set, del } from "../db";

export type Phrase = {
  id: number | string;
  es: string;
  en: string;
  categoria?: string;
};

export type ConversationTurn = {
  speaker: "Hostel Staff" | "Guest";
  english: string;
  spanish: string;
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
  progress: Record<string, number>;
  prefs: {
    theme: string;
    audioSpeed: number;
    /**
     * Stores per-participant speech synthesis settings for conversations.
     * Key is the participant's name, value is an object with voiceURI, rate, and pitch.
     */
    conversationSettings: {
      [participant: string]: {
        voiceURI: string;
        rate: number;
        pitch: number;
      };
    };
    phraseSettings: {
      voiceURI: string;
      rate: number;
      pitch: number;
    };
  };
  phrasesCurrentPage: number;
  phrasesPerPage: number;
};

type Actions = {
  initializeCategories: () => void;
  advancePhraseProgress: (phraseId: string) => void;
  setTheme: (theme: string) => void;
  setAudioSpeed: (speed: number) => void;
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
  setPhrasesCurrentPage: (page: number) => void;
  setPhrasesPerPage: (limit: number) => void;
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
        theme: "light",
        audioSpeed: 1,
        conversationSettings: {}, // Initialize conversation settings as an empty object
        phraseSettings: {
          voiceURI: '',
          rate: 1,
          pitch: 1,
        },
      },
      phrasesCurrentPage: 1,
      phrasesPerPage: 10,
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
          const res = await fetch("/data/hostelenglish_dataset_clean.json");
          const data = await res.json();
          set({ frases: data.phrases || [], frasesLoaded: true });
        } catch (e) {
          console.warn("No se pudo cargar el dataset de frases.", e);
        }
      },
      loadConversations: async () => {
        if (get().conversationsLoaded) return;
        try {
          const res = await fetch(`${import.meta.env.BASE_URL}data/conversations_extended_v4.json`);
          const data = await res.json();
          set({ conversations: data.conversations || [], conversationsLoaded: true });
        } catch (e) {
          console.warn("No se pudo cargar el dataset de conversaciones.", e);
        }
      },
      advancePhraseProgress: (phraseId: string) => {
        set((state) => {
          const currentLevel = state.progress[phraseId] || 0;
          const nextLevel = (currentLevel + 1) % 3; // Cycles 0 -> 1 -> 2 -> 0
          return {
            progress: {
              ...state.progress,
              [phraseId]: nextLevel,
            },
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
      setPhrasesCurrentPage: (page) => set({ phrasesCurrentPage: page }),
      setPhrasesPerPage: (limit) => set({ phrasesPerPage: limit, phrasesCurrentPage: 1 }), // Reset to first page
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
        phrasesCurrentPage: state.phrasesCurrentPage,
        phrasesPerPage: state.phrasesPerPage,
      }),
    }
  )
);
