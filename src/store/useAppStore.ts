import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { get, set, del } from "../db";

type Phrase = {
  id: number | string;
  es: string;
  en: string;
  categoria?: string;
};

type State = {
  frases: Phrase[];
  loadFrases: () => Promise<void>;
  progress: Record<string, boolean>; // { phraseId: true/false (estudiada) }
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
      progress: {},
      prefs: { theme: "light", audioSpeed: 1 },
      loadFrases: async () => {
        try {
          const res = await fetch("/data/hostelenglish_dataset_clean.json");
          const data = await res.json();
          set({ frases: data });
        } catch (e) {
          console.warn(
            "No se pudo cargar el dataset de frases. Usa /public/data para colocarlo.",
            e
          );
          set({ frases: [] });
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
      name: "hostelenglish-storage", // nombre para el almacenamiento
      storage: createJSONStorage(() => ({
        getItem: async (name) => {
          console.log("Getting item from IDB:", name);
          const value = await get(name);
          return value ? JSON.stringify(value) : null;
        },
        setItem: async (name, value) => {
          console.log("Setting item to IDB:", name, value);
          await set(name, JSON.parse(value));
        },
        removeItem: async (name) => {
          console.log("Removing item from IDB:", name);
          await del(name);
        },
      })),
      // Opcional: especificar qué partes del estado persistir
      partialize: (state) => ({
        progress: state.progress,
        prefs: state.prefs,
      }),
    }
  )
);
