import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Proveer fake-indexeddb para tests que usan IndexedDB directamente
import 'fake-indexeddb/auto';

// Asegurar que indexedDB es accesible como variable global para librerías ESM
// como idb, que lo consultan como indexedDB.open(...) en vez de globalThis.indexedDB.
if (typeof indexedDB === 'undefined' && globalThis.indexedDB) {
  (globalThis as any).indexedDB = globalThis.indexedDB;
}

// Si fake-indexeddb no instaló indexedDB como global, construimos un polyfill
// mínimo suficiente para idb/openDB.
// ---------------------------------------------------------------------------
let _fakeIDB: any = null;
function ensureIndexedDB(): any {
  if (typeof indexedDB !== 'undefined') return indexedDB;
  if (_fakeIDB) return _fakeIDB;
  try {
    // dynamic import para no fallar si el paquete no está
    // fake-indexeddb v7 expone FDBDatabase como clase con .open()
    const mod = require('fake-indexeddb');
    const FDBDatabase = mod.FDBDatabase || (mod as any).default?.FDBDatabase;
    if (FDBDatabase) {
      const db = new FDBDatabase();
      _fakeIDB = {
        open: (name: string, version?: number) => {
          const req = db.open(name, version);
          return new Promise((resolve, reject) => {
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
          });
        },
        deleteDatabase: (name: string) => {
          return new Promise<void>((resolve) => {
            const req = db.deleteDatabase(name);
            req.onsuccess = () => resolve();
            req.onerror = () => resolve();
          });
        },
        databases: () => Promise.resolve([]),
      };
      (globalThis as any).indexedDB = _fakeIDB;
      return _fakeIDB;
    }
  } catch { /* ignore */ }
  return null;
}

// Export para que tests puedan llamar a ensureIndexedDB si lo necesitan
export { ensureIndexedDB };

// Ejecutar polyfill al cargar el setup
try { ensureIndexedDB(); } catch { /* noop */ }

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
