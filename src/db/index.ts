import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'hostelenglish-v1';
export const DB_NAME_SHARED = DB_NAME;
// v3: appState + outboxQueue se crean en un único upgrade compartido por ambos módulos.
export const DB_VERSION = 3;
const STORE_NAME = 'appState'; // Store para el estado persistido de la app
const OUTBOX_STORE = 'outboxQueue';

/** Upgrade único compartido por appState y outboxQueue (misma BD, misma versión). */
export const upgradeHostelDB = (db: IDBPDatabase<any>): void => {
  if (!db.objectStoreNames.contains(STORE_NAME)) {
    db.createObjectStore(STORE_NAME);
  }
  if (!db.objectStoreNames.contains(OUTBOX_STORE)) {
    const store = db.createObjectStore(OUTBOX_STORE, { keyPath: 'id', autoIncrement: true });
    store.createIndex('by-timestamp', 'timestamp');
    store.createIndex('by-status', 'status');
  }
};

interface MyDB extends IDBPDatabase {
  schemas: {
    appState: { key: string; value: any };
  };
}

/** Rechaza si la promesa no se resuelve en `ms` (IndexedDB puede quedarse colgada). */
export const withTimeout = <T>(promise: Promise<T>, ms: number, label = 'operación'): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timeout (${ms}ms) en ${label}`)), ms);
    promise.then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); },
    );
  });

export const initDB = async (): Promise<IDBPDatabase<MyDB>> => {
  return openDB<MyDB>(DB_NAME, DB_VERSION, {
    upgrade: upgradeHostelDB,
    // Una pestaña/SW antiguo con la BD abierta bloquearía el upgrade para siempre.
    blocking() {
      console.warn('[db] Otra versión solicita upgrade; conexión antigua en uso.');
    },
    blocked() {
      console.warn('[db] Upgrade bloqueado por otra pestaña con versión anterior.');
    },
  });
};

/** Tiempo máximo para abrir IndexedDB antes de pasar a memoria. */
export const IDB_OPEN_TIMEOUT_MS = 1500;

/**
 * Fallback en memoria (BUG-03): en incógnito/WebViews restringidos `indexedDB.open`
 * puede lanzar SecurityError o colgarse. Tras el primer fallo todo el almacenamiento
 * pasa a este Map de forma instantánea, sin bloquear el arranque.
 */
const memoryStore = new Map<string, unknown>();
let idbUnavailable = false;

export const isIdbUnavailable = (): boolean => idbUnavailable;

/** Solo para tests. */
export const __resetIdbFallback = (): void => {
  idbUnavailable = false;
  memoryStore.clear();
};

const markUnavailable = (err: unknown): void => {
  if (!idbUnavailable) {
    console.warn('[db] IndexedDB no disponible; usando almacenamiento en memoria:', err);
  }
  idbUnavailable = true;
};

const openSafe = async (): Promise<IDBPDatabase<MyDB> | null> => {
  if (idbUnavailable) return null;
  try {
    return await withTimeout(initDB(), IDB_OPEN_TIMEOUT_MS, 'apertura de IndexedDB');
  } catch (err) {
    markUnavailable(err);
    return null;
  }
};

export const set = async <T>(key: string, value: T): Promise<string> => {
  const db = await openSafe();
  if (db) {
    try {
      await db.put(STORE_NAME, value, key);
      return key;
    } catch (err) {
      markUnavailable(err);
    }
  }
  memoryStore.set(key, value);
  return key;
};

export const get = async <T>(key: string): Promise<T | undefined> => {
  const db = await openSafe();
  if (db) {
    try {
      return await db.get(STORE_NAME, key);
    } catch (err) {
      markUnavailable(err);
    }
  }
  return memoryStore.get(key) as T | undefined;
};

export const del = async (key: string): Promise<void> => {
  const db = await openSafe();
  if (db) {
    try {
      await db.delete(STORE_NAME, key);
      return;
    } catch (err) {
      markUnavailable(err);
    }
  }
  memoryStore.delete(key);
};
