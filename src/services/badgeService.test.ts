import { describe, it, expect, vi } from 'vitest';
import { countDueReviews, updateAppBadge, isBadgeSupported } from './badgeService';

const now = new Date('2026-11-02T12:00:00Z');
const item = (d: Date | string) => ({ dueDate: d as Date });

describe('countDueReviews', () => {
  it('cuenta solo dueDate <= now', () => {
    const items = {
      a: item(new Date('2026-11-01T00:00:00Z')),
      b: item(new Date('2026-11-02T12:00:00Z')),
      c: item(new Date('2026-11-03T00:00:00Z')),
    };
    expect(countDueReviews(items, now)).toBe(2);
  });
  it('acepta fechas string (rehidratadas) y entradas inválidas', () => {
    expect(countDueReviews({ a: item('2026-10-01T00:00:00Z'), b: item('nope') }, now)).toBe(1);
    expect(countDueReviews({}, now)).toBe(0);
    expect(countDueReviews(undefined, now)).toBe(0);
  });
});

describe('updateAppBadge', () => {
  it('llama a setAppBadge con el contador', async () => {
    const set = vi.fn().mockResolvedValue(undefined);
    const clear = vi.fn();
    const nav = { setAppBadge: set, clearAppBadge: clear } as unknown as Navigator;
    expect(await updateAppBadge(5, nav)).toBe(true);
    expect(set).toHaveBeenCalledWith(5);
    expect(clear).not.toHaveBeenCalled();
  });
  it('llama a clearAppBadge con 0', async () => {
    const set = vi.fn();
    const clear = vi.fn().mockResolvedValue(undefined);
    const nav = { setAppBadge: set, clearAppBadge: clear } as unknown as Navigator;
    expect(await updateAppBadge(0, nav)).toBe(true);
    expect(clear).toHaveBeenCalled();
    expect(set).not.toHaveBeenCalled();
  });
  it('no lanza si la API no está soportada', async () => {
    const nav = {} as Navigator;
    expect(isBadgeSupported(nav)).toBe(false);
    await expect(updateAppBadge(3, nav)).resolves.toBe(false);
    await expect(updateAppBadge(0, nav)).resolves.toBe(false);
    await expect(updateAppBadge(1, undefined)).resolves.toBe(false);
  });
  it('no lanza si la API rechaza', async () => {
    const nav = { setAppBadge: vi.fn().mockRejectedValue(new Error('denied')) } as unknown as Navigator;
    await expect(updateAppBadge(2, nav)).resolves.toBe(false);
  });
});
