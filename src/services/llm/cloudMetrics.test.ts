import { describe, it, expect, beforeEach } from 'vitest';

import { CloudMetricsStore, getCloudMetricsStore } from './cloudMetrics';

describe('CloudMetricsStore', () => {
  beforeEach(async () => {
    await new CloudMetricsStore().clear();
  });

  it('guarda y recupera registros ordenados por ts descendente', async () => {
    const store = new CloudMetricsStore();
    await store.record({ ts: 1, route: 'cloud', model: 'm', elapsedMs: 100, ok: true });
    await store.record({
      ts: 2,
      route: 'cloud',
      model: 'm',
      elapsedMs: 200,
      ok: false,
      errorCode: 'NETWORK',
    });

    const recent = await store.recent();
    expect(recent).toHaveLength(2);
    expect(recent[0].ts).toBe(2);
    expect(recent[0].errorCode).toBe('NETWORK');
    expect(recent[1].ts).toBe(1);
  });

  it('asigna claves autoincrementales crecientes', async () => {
    const store = new CloudMetricsStore();
    const id1 = await store.record({ ts: 1, route: 'cloud', elapsedMs: 1, ok: true });
    const id2 = await store.record({ ts: 2, route: 'cloud', elapsedMs: 1, ok: true });
    expect(id1).toBeGreaterThan(0);
    expect(id2).toBeGreaterThan(id1);
  });

  it('clear vacía el almacén', async () => {
    const store = new CloudMetricsStore();
    await store.record({ ts: 1, route: 'cloud', elapsedMs: 1, ok: true });
    await store.clear();
    expect(await store.recent()).toHaveLength(0);
  });
});

describe('getCloudMetricsStore', () => {
  it('devuelve siempre la misma instancia (singleton)', () => {
    expect(getCloudMetricsStore()).toBe(getCloudMetricsStore());
  });
});