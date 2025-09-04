import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { get, set, del } from "../db";

type Phrase = {
  id: number | string;
  es: string;
  en: string;
  categoria?: string;
};

type ConversationTurn = {
  speaker: "Hostel Staff" | "Guest";
  english: string;
  spanish: string;
  audio?: string;
};

type Conversation = {
  id: number;
  title: string;
  description: string;
  dialogue: ConversationTurn[]; // Cambiado de turns a dialogue
  categoria?: string;
};

type State = {
  frases: Phrase[];
  conversations: Conversation[];
  categories: string[];
  frasesLoaded: boolean;
  conversationsLoaded: boolean;
  loadFrases: () => Promise<void>;
  loadConversations: () => Promise<void>;
  progress: Record<string, boolean>;
  prefs: { theme: string; audioSpeed: number };
};

type Actions = {
  togglePhraseStudied: (phraseId: string) => void;
  setTheme: (theme: string) => void;
  setAudioSpeed: (speed: number) => void;
};

export const useAppStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      frases: [],
      conversations: [],
      categories: [],
      frasesLoaded: false,
      conversationsLoaded: false,
      progress: {},
      prefs: { theme: "light", audioSpeed: 1 },
      loadFrases: async () => {
        try {
          const res = await fetch("/data/hostelenglish_dataset_clean.json");
          const data = await res.json();
          const frases = data.phrases || [];
          set({ frases, frasesLoaded: true });
          
          const currentCategories = get().categories;
          const newCategories = frases.map(f => f.categoria).filter(Boolean) as string[];
          const allCategories = [...new Set([...currentCategories, ...newCategories])];
          set({ categories: allCategories });

        } catch (e) {
          console.warn("No se pudo cargar el dataset de frases.", e);
          set({ frases: [], frasesLoaded: true });
        }
      },
      loadConversations: async () => {
        try {
          const res = await fetch("/data/conversations_extended_v4.json");
          const data = await res.json();
          const conversations = data.conversations || [];
          set({ conversations, conversationsLoaded: true });

          const currentCategories = get().categories;
          const newCategories = conversations.map(c => c.categoria).filter(Boolean) as string[];
          const allCategories = [...new Set([...currentCategories, ...newCategories])];
          set({ categories: allCategories });

        } catch (e) {
          console.warn("No se pudo cargar el dataset de conversaciones.", e);
          set({ conversations: [], conversationsLoaded: true });
        }
      },
      togglePhraseStudied: (phraseId: string) => {
        set((state) => ({
          progress: {
            ...state.progress,
            [phraseId]: !state.progress[phraseId],
          },
        }));
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
      }),
    }
  )
);
