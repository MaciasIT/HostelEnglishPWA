import { openDB, type IDBPDatabase } from 'idb';

const DB_NAME = 'hostelenglish-v1';
const DB_VERSION = 2;
const STORE_NAME = 'outboxQueue';

export interface OutboxItem {
  id?: number;
  type: string;
  payload: unknown;
  timestamp: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  retries: number;
}

export interface OutboxDB extends IDBPDatabase {
  schemas: {
    outboxQueue: {
      key: number;
      value: OutboxItem;
      indexes: { 'by-timestamp': number; 'by-status': string };
    };
  };
}

export const initOutboxDB = async (): Promise<IDBPDatabase<OutboxDB>> => {
  return openDB<OutboxDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: 'id',
          autoIncrement: true,
        });
        store.createIndex('by-timestamp', 'timestamp');
        store.createIndex('by-status', 'status');
      }
    },
  });
};

export const enqueue = async (item: Omit<OutboxItem, 'id'>): Promise<number> => {
  const db = await initOutboxDB();
  return db.add(STORE_NAME, item as OutboxItem) as Promise<number>;
};

export const getPending = async (): Promise<OutboxItem[]> => {
  const db = await initOutboxDB();
  return db.getAllFromIndex(STORE_NAME, 'by-status', 'pending');
};

export const getAll = async (): Promise<OutboxItem[]> => {
  const db = await initOutboxDB();
  return db.getAll(STORE_NAME);
};

export const removeItem = async (id: number): Promise<void> => {
  const db = await initOutboxDB();
  await db.delete(STORE_NAME, id);
};

export const clear = async (): Promise<void> => {
  const db = await initOutboxDB();
  await db.clear(STORE_NAME);
};

export const updateItem = async (item: OutboxItem): Promise<void> => {
  const db = await initOutboxDB();
  await db.put(STORE_NAME, item);
};
