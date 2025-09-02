import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'hostelenglish-v1';
const DB_VERSION = 1;
const STORE_NAME = 'appState'; // Una única store para todo el estado de la app

interface MyDB extends IDBPDatabase {
  schemas: {
    appState: { key: string; value: any };
  };
}

export const initDB = async (): Promise<IDBPDatabase<MyDB>> => {
  return openDB<MyDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
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
