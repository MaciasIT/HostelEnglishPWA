/**
 * Portafolio de voz: hasta 3 muestras del examen oral guardadas en IndexedDB.
 *
 * Base de datos propia (`voicePortfolio`) para no interferir con el estado
 * de la app. Se guarda ArrayBuffer + MIME (clonado estructural fiable, también
 * en fake-indexeddb). Cada muestra ocupa un hueco 0..2; regrabar = sobrescribir.
 */
import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

export const VOICE_DB_NAME = 'voicePortfolio';
const DB_VERSION = 1;
const STORE = 'samples';

export const MAX_SAMPLES = 3;
export const MAX_DURATION_SECONDS = 30;
export const MAX_SAMPLE_BYTES = 200 * 1024;
export const ALLOWED_MIME_PREFIXES = ['audio/webm', 'audio/ogg'] as const;

export interface VoiceSample {
  /** Hueco 0..MAX_SAMPLES-1 */
  slot: number;
  buffer: ArrayBuffer;
  mimeType: string;
  durationSeconds: number;
  sizeBytes: number;
  createdAt: string;
}

export type VoicePortfolioErrorCode =
  | 'INVALID_SLOT'
  | 'INVALID_MIME'
  | 'TOO_LONG'
  | 'TOO_LARGE'
  | 'EMPTY';

export class VoicePortfolioError extends Error {
  constructor(public code: VoicePortfolioErrorCode, message: string) {
    super(message);
    this.name = 'VoicePortfolioError';
  }
}

interface VoiceSchema extends DBSchema {
  samples: { key: number; value: VoiceSample };
}

let dbPromise: Promise<IDBPDatabase<VoiceSchema>> | null = null;

function getDb(): Promise<IDBPDatabase<VoiceSchema>> {
  if (!dbPromise) {
    dbPromise = openDB<VoiceSchema>(VOICE_DB_NAME, DB_VERSION, {
      upgrade(db) {
        db.createObjectStore(STORE, { keyPath: 'slot' });
      },
    }).catch((e) => {
      dbPromise = null;
      throw e;
    });
  }
  return dbPromise;
}

/** Cierra la conexión cacheada (útil en tests). */
export async function resetVoicePortfolioConnection(): Promise<void> {
  if (dbPromise) {
    try {
      (await dbPromise).close();
    } catch {
      /* ignorar */
    }
    dbPromise = null;
  }
}

function validateSlot(slot: number): void {
  if (!Number.isInteger(slot) || slot < 0 || slot >= MAX_SAMPLES) {
    throw new VoicePortfolioError('INVALID_SLOT', `El hueco debe estar entre 0 y ${MAX_SAMPLES - 1}.`);
  }
}

/** Guarda (o sobrescribe = regrabar) una muestra en el hueco indicado. */
export async function saveSample(
  slot: number,
  blob: Blob,
  durationSeconds: number,
): Promise<VoiceSample> {
  validateSlot(slot);
  const mimeType = blob.type || '';
  if (!ALLOWED_MIME_PREFIXES.some((p) => mimeType.startsWith(p))) {
    throw new VoicePortfolioError('INVALID_MIME', 'Formato no permitido: usa audio/webm o audio/ogg.');
  }
  if (blob.size === 0) throw new VoicePortfolioError('EMPTY', 'La grabación está vacía.');
  if (!(durationSeconds <= MAX_DURATION_SECONDS)) {
    throw new VoicePortfolioError('TOO_LONG', `Máximo ${MAX_DURATION_SECONDS} segundos por muestra.`);
  }
  if (blob.size > MAX_SAMPLE_BYTES) {
    throw new VoicePortfolioError('TOO_LARGE', 'La muestra supera los 200 KB.');
  }
  const sample: VoiceSample = {
    slot,
    buffer: await blobToArrayBuffer(blob),
    mimeType,
    durationSeconds,
    sizeBytes: blob.size,
    createdAt: new Date().toISOString(),
  };
  const db = await getDb();
  await db.put(STORE, sample);
  return sample;
}

export async function getSample(slot: number): Promise<VoiceSample | undefined> {
  validateSlot(slot);
  return (await getDb()).get(STORE, slot);
}

/** Todas las muestras guardadas, ordenadas por hueco. */
export async function listSamples(): Promise<VoiceSample[]> {
  const all = await (await getDb()).getAll(STORE);
  return all.sort((a, b) => a.slot - b.slot);
}

export async function deleteSample(slot: number): Promise<void> {
  validateSlot(slot);
  await (await getDb()).delete(STORE, slot);
}

export async function clearSamples(): Promise<void> {
  await (await getDb()).clear(STORE);
}

/** Reconstruye un Blob reproducible/exportable. */
export function sampleToBlob(sample: VoiceSample): Blob {
  return new Blob([sample.buffer], { type: sample.mimeType });
}

/** Reproducción local inmediata. Devuelve el elemento y una función de limpieza. */
export function playSample(sample: VoiceSample): { audio: HTMLAudioElement; dispose: () => void } {
  const url = URL.createObjectURL(sampleToBlob(sample));
  const audio = new Audio(url);
  const dispose = () => {
    audio.pause();
    URL.revokeObjectURL(url);
  };
  audio.addEventListener('ended', dispose, { once: true });
  void audio.play?.();
  return { audio, dispose };
}

/** Nombre de fichero para exportación individual. */
export function sampleFileName(sample: VoiceSample): string {
  const ext = sample.mimeType.startsWith('audio/ogg') ? 'ogg' : 'webm';
  return `hostelenglish-voz-${sample.slot + 1}.${ext}`;
}

function blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  if (typeof blob.arrayBuffer === 'function') return blob.arrayBuffer();
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as ArrayBuffer);
    r.onerror = () => reject(r.error);
    r.readAsArrayBuffer(blob);
  });
}
