import { StateCreator } from 'zustand';
import { Phrase, Conversation } from '../types';

export interface DataSlice {
  frases: Phrase[];
  conversations: Conversation[];
  categories: string[];
  frasesLoaded: boolean;
  conversationsLoaded: boolean;
  activePhraseSet: Phrase[];
  loadFrases: () => Promise<void>;
  loadConversations: () => Promise<void>;
  initializeCategories: () => void;
  setActivePhraseSet: (phrases: Phrase[]) => void;
}

export const createDataSlice: StateCreator<DataSlice> = (set, get) => ({
  frases: [],
  conversations: [],
  categories: ['Estudiadas', 'Aprendidas'],
  frasesLoaded: false,
  conversationsLoaded: false,
  activePhraseSet: [],

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

  setActivePhraseSet: (phrases) => set({ activePhraseSet: phrases }),
});
