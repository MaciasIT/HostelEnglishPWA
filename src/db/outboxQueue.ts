import { openDB, type IDBPDatabase } from 'idb';

import { DB_NAME_SHARED as DB_NAME, DB_VERSION, upgradeHostelDB } from './index';

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
    upgrade: upgradeHostelDB,
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
