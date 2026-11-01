/**
 * Caché local en IndexedDB de fragmentos de audio sintetizados.
 *
 * Los motores que producen buffers reales (Piper, Cloud) guardan aquí el
 * resultado por clave determinista (texto + idioma + motor) para no volver a
 * sintetizar fragmentos frecuentes en turnos posteriores.
 *
 * Se almacena `ArrayBuffer` + MIME type en vez de `Blob` porque `ArrayBuffer`
 * es un tipo de clonado estructurado de primera clase que sobrevive el
 * round-trip tanto en IndexedDB real como en entornos de test (fake-indexeddb).
 *
 * Usa una base de datos distinta a la de estado de la app para no interferir
 * con `hostelenglish-v1` (véase el hallazgo de conflicto de versión de Fase B).
 */

import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

import type { AudioEngineType, SpeechLanguage } from './types';

const DB_NAME = 'hostel-audio-cache';
const DB_VERSION = 1;
const STORE = 'fragments';

/** Fragmento de audio cacheable: bytes decodificados + tipo MIME. */
export interface AudioFragment {
  buffer: ArrayBuffer;
  mimeType: string;
}

interface AudioCacheSchema extends DBSchema {
  fragments: {
    key: string;
    value: AudioFragment;
  };
}

/** Hash FNV-1a de 32 bits (rápido y suficiente para claves de caché). */
export function hashText(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16);
}

/** Clave de caché determinista para un fragmento sintetizado. */
export function fragmentKey(
  text: string,
  language: SpeechLanguage,
  engine: AudioEngineType,
): string {
  return `${engine}:${language}:${hashText(text)}`;
}

/** Almacén de fragmentos de audio en IndexedDB. */
export class AudioCache {
  private dbPromise: Promise<IDBPDatabase<AudioCacheSchema>> | null = null;

  private getDb(): Promise<IDBPDatabase<AudioCacheSchema>> {
    if (!this.dbPromise) {
      this.dbPromise = openDB<AudioCacheSchema>(DB_NAME, DB_VERSION, {
        upgrade(db) {
          if (!db.objectStoreNames.contains(STORE)) {
            db.createObjectStore(STORE);
          }
        },
      });
    }
    return this.dbPromise;
  }

  /** Recupera un fragmento cacheado o `undefined` si no existe. */
  async get(key: string): Promise<AudioFragment | undefined> {
    const db = await this.getDb();
    return db.get(STORE, key);
  }

  /** Guarda un fragmento bajo una clave. */
  async put(key: string, fragment: AudioFragment): Promise<void> {
    const db = await this.getDb();
    await db.put(STORE, fragment, key);
  }

  /** Indica si existe una entrada para la clave. */
  async has(key: string): Promise<boolean> {
    const db = await this.getDb();
    const keyFound = await db.getKey(STORE, key);
    return keyFound !== undefined;
  }

  /** Elimina una entrada. */
  async delete(key: string): Promise<void> {
    const db = await this.getDb();
    await db.delete(STORE, key);
  }

  /** Vacía la caché completa. */
  async clear(): Promise<void> {
    const db = await this.getDb();
    await db.clear(STORE);
  }
}