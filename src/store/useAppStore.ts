import { create } from "zustand";

type Phrase = {
  id: number | string;
  es: string;
  en: string;
  categoria?: string;
};

type State = {
  frases: Phrase[];
  loadFrases: () => Promise<void>;
};

export const useAppStore = create<State>((set) => ({
  frases: [],
  loadFrases: async () => {
    try {
      const res = await fetch("/data/hostelenglish_dataset_clean.json");
      const data = await res.json();
      set({ frases: data });
    } catch (e) {
      console.warn("No se pudo cargar el dataset de frases. Usa /public/data para colocarlo.", e);
      set({ frases: [] });
    }
  },
}));
