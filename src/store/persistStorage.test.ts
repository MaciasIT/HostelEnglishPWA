import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import 'fake-indexeddb/auto';
import * as db from '@/db';
import { readPersistedState, STORAGE_READ_TIMEOUT_MS } from './persistStorage';

describe('persistStorage – arranque resistente (BUG-01)', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('devuelve null si no hay nada guardado', async () => {
    expect(await readPersistedState('k-empty')).toBeNull();
  });

  it('estado corrupto (string en vez de objeto) → null y reset del dato', async () => {
    await db.set('k-corrupt', 'basura{{{' as any);
    expect(await readPersistedState('k-corrupt')).toBeNull();
    await vi.waitFor(async () => expect(await db.get('k-corrupt')).toBeUndefined());
  });

  it('estado legacy con progress corrupto no lanza → null', async () => {
    await db.set('k-legacy', { progress: 'no-es-objeto-pero-truthy', version: 0 } as any);
    await expect(readPersistedState('k-legacy')).resolves.toBeDefined();
  });

  it('esquema legacy válido se migra a v1', async () => {
    await db.set('k-ok', { progress: { 1: 2 }, prefs: { targetLanguage: 'en' } } as any);
    const out = await readPersistedState('k-ok');
    expect(out).not.toBeNull();
    expect(JSON.parse(out!).state.version).toBe(1);
  });

  it('IndexedDB colgada → resuelve null tras el timeout (no bloquea)', async () => {
    vi.useFakeTimers();
    vi.spyOn(db, 'get').mockImplementation(() => new Promise(() => {}));
    const p = readPersistedState('k-hang');
    await vi.advanceTimersByTimeAsync(STORAGE_READ_TIMEOUT_MS + 10);
    await expect(p).resolves.toBeNull();
  });

  it('IndexedDB lanza excepción → null', async () => {
    vi.spyOn(db, 'get').mockRejectedValue(new Error('boom'));
    await expect(readPersistedState('k-throw')).resolves.toBeNull();
  });
});
