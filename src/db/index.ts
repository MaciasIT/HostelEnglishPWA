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

export const set = async <T>(key: string, value: T): Promise<string> => {
  const db = await initDB();
  await db.put(STORE_NAME, value, key);
  return key;
};

export const get = async <T>(key: string): Promise<T | undefined> => {
  const db = await initDB();
  return db.get(STORE_NAME, key);
};

export const del = async (key: string): Promise<void> => {
  const db = await initDB();
  await db.delete(STORE_NAME, key);
};
