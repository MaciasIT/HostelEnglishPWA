import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Proveer fake-indexeddb para tests que usan IndexedDB directamente
import 'fake-indexeddb/auto';

// Asegurar que indexedDB es accesible como variable global para librerías ESM
// como idb, que lo consultan como indexedDB.open(...) en vez de globalThis.indexedDB.
if (typeof indexedDB === 'undefined' && globalThis.indexedDB) {
  (globalThis as any).indexedDB = globalThis.indexedDB;
}

// Mock de la API de Síntesis de Voz del navegador para el entorno JSDOM
Object.defineProperty(window, 'speechSynthesis', {
  value: {
    cancel: vi.fn(),
    speak: vi.fn(),
    getVoices: vi.fn(() => [{ name: 'Mock Voice', lang: 'en-US', default: true }]),
    pause: vi.fn(),
    resume: vi.fn(),
    paused: false,
    pending: false,
    speaking: false,
    onvoiceschanged: null,
  },
  writable: true,
});

// Mock de la clase SpeechSynthesisUtterance
(globalThis as any).SpeechSynthesisUtterance = class SpeechSynthesisUtterance {
  text: string;
  lang: string;
  pitch: number;
  rate: number;
  voice: any;
  volume: number;
  onend: any;
  onerror: any;

  constructor(text: string) {
    this.text = text;
    this.lang = '';
    this.pitch = 1;
    this.rate = 1;
    this.voice = null;
    this.volume = 1;
    this.onend = null;
    this.onerror = null;
  }
};
