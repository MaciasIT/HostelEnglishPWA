import { getPending, removeItem, updateItem, enqueue, type OutboxItem } from '@/db/outboxQueue';

export type ProgressEventType =
  | 'advance_phrase'
  | 'record_activity'
  | 'record_exam'
  | 'achievement_unlocked';

export interface ProgressEvent {
  type: ProgressEventType;
  payload: Record<string, unknown>;
}

let isProcessing = false;
let isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
let initialized = false;

/**
 * Initializes the sync service: registers online/offline listeners
 * and drains the outbox queue automatically when connection is recovered.
 */
export const initSync = (): void => {
  if (typeof window === 'undefined' || initialized) return;
  initialized = true;

  const processQueue = async (): Promise<void> => {
    if (isProcessing || !isOnline) return;
    isProcessing = true;

    try {
      const pending = await getPending();
      for (const item of pending) {
        try {
          await syncItem(item);
          await removeItem(item.id!);
        } catch (err) {
          console.error('[Sync] Failed to sync item', item, err);
          await updateItem({
            ...item,
            status: 'failed',
            retries: item.retries + 1,
          });
        }
      }
    } finally {
      isProcessing = false;
    }
  };

  window.addEventListener('online', () => {
    isOnline = true;
    processQueue();
  });

  window.addEventListener('offline', () => {
    isOnline = false;
  });

  if (isOnline) {
    processQueue();
  }
};

/**
 * Enqueues a progress event for background sync.
 */
export const queueProgressEvent = async (event: ProgressEvent): Promise<void> => {
  try {
    await enqueue({
      type: event.type,
      payload: event.payload,
      timestamp: Date.now(),
      status: 'pending',
      retries: 0,
    });
  } catch (err) {
    console.error('[Sync] Failed to enqueue progress event', event, err);
  }
};

/**
 * Processes a single outbox item.
 * In production this would POST to an API; here we simulate a successful sync.
 */
const syncItem = async (_item: OutboxItem): Promise<void> => {
  // Production: await fetch('/api/progress/sync', { method: 'POST', body: JSON.stringify(item) });
  await new Promise((resolve) => setTimeout(resolve, 50));
};
