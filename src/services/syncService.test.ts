import { describe, it, expect, beforeEach, vi } from 'vitest';
import { clear, enqueue, getPending, getAll, updateItem, type OutboxItem } from '@/db/outboxQueue';
import { initSync, queueProgressEvent, type ProgressEvent } from '@/services/syncService';

// Los tests de sync usan fake-indexeddb y necesitan más tiempo
vi.setConfig({ testTimeout: 20000 });

describe('Sync Service', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    try {
      await clear();
    } catch (e) {
      // ignore if DB not yet initialized
    }
  });

  it('debería encolar eventos de progreso en IndexedDB', async () => {
    const event: ProgressEvent = {
      type: 'advance_phrase',
      payload: { phraseId: '1' },
    };

    await queueProgressEvent(event);
    const pending = await getPending();

    expect(pending).toHaveLength(1);
    expect(pending[0].type).toBe('advance_phrase');
    expect(pending[0].payload).toEqual({ phraseId: '1' });
    expect(pending[0].status).toBe('pending');
    expect(typeof pending[0].timestamp).toBe('number');
  });

  it('debería vaciar la cola al estar online', async () => {
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true });

    await enqueue({
      type: 'record_activity',
      payload: { date: '2026-11-01' },
      timestamp: Date.now(),
      status: 'pending',
      retries: 0,
    });

    initSync();
    window.dispatchEvent(new Event('online'));

    await new Promise((resolve) => setTimeout(resolve, 200));

    const pending = await getPending();
    expect(pending).toHaveLength(0);
  });

  it('debería mantener elementos en cola cuando está offline y procesarlos al reconectar', async () => {
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true, configurable: true });

    await enqueue({
      type: 'record_exam',
      payload: { score: 8, total: 10 },
      timestamp: Date.now(),
      status: 'pending',
      retries: 0,
    });

    let pending = await getPending();
    expect(pending).toHaveLength(1);

    Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true });
    initSync();
    window.dispatchEvent(new Event('online'));

    await new Promise((resolve) => setTimeout(resolve, 200));

    pending = await getPending();
    expect(pending).toHaveLength(0);
  });

  it('debería manejar errores marcando items como failed', async () => {
    const item: OutboxItem = {
      type: 'achievement_unlocked',
      payload: { achievement: 'test' },
      timestamp: Date.now(),
      status: 'pending',
      retries: 0,
    };

    const id = await enqueue(item);
    const items = await getPending();
    const target = items.find((i: any) => i.id === id)!;

    await updateItem({ ...target, status: 'failed', retries: 1 });

    const pending = await getPending();
    expect(pending).toHaveLength(0);

    const all = await getAll();
    expect(all).toHaveLength(1);
    expect(all[0].status).toBe('failed');
    expect(all[0].retries).toBe(1);
  });

  it('debería limpiar toda la cola', async () => {
    await enqueue({
      type: 'advance_phrase',
      payload: { phraseId: '1' },
      timestamp: Date.now(),
      status: 'pending',
      retries: 0,
    });
    await enqueue({
      type: 'record_activity',
      payload: { date: '2026-11-01' },
      timestamp: Date.now(),
      status: 'pending',
      retries: 0,
    });

    let all = await getAll();
    expect(all).toHaveLength(2);

    await clear();

    all = await getAll();
    expect(all).toHaveLength(0);
  });
});
