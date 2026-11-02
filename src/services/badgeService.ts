import { useAppStore } from '@/store/useAppStore';
import type { ReviewItem } from '@/services/fsrsScheduler';

type BadgeNavigator = Navigator & {
  setAppBadge?: (count?: number) => Promise<void>;
  clearAppBadge?: () => Promise<void>;
};

const defaultNav = (): Navigator | undefined => (typeof navigator !== 'undefined' ? navigator : undefined);

/** Cuenta los repasos FSRS con dueDate <= now (acepta Date o string ISO tras rehidratar). */
export function countDueReviews(
  reviewItems: Record<string, Pick<ReviewItem, 'dueDate'>> | undefined | null,
  now: Date = new Date(),
): number {
  if (!reviewItems) return 0;
  const t = now.getTime();
  let n = 0;
  for (const item of Object.values(reviewItems)) {
    if (!item?.dueDate) continue;
    const due = new Date(item.dueDate as unknown as string | Date).getTime();
    if (!Number.isNaN(due) && due <= t) n++;
  }
  return n;
}

export function isBadgeSupported(nav: Navigator | undefined = defaultNav()): boolean {
  return !!nav && typeof (nav as BadgeNavigator).setAppBadge === 'function';
}

/** Actualiza el badge del icono; nunca lanza. Devuelve true si llamó a la API. */
export async function updateAppBadge(count: number, nav: Navigator | undefined = defaultNav()): Promise<boolean> {
  if (!nav) return false;
  const n = nav as BadgeNavigator;
  try {
    if (count > 0) {
      if (typeof n.setAppBadge === 'function') {
        await n.setAppBadge(count);
        return true;
      }
      return false;
    }
    if (typeof n.clearAppBadge === 'function') {
      await n.clearAppBadge();
      return true;
    }
    if (typeof n.setAppBadge === 'function') {
      await n.setAppBadge(0); // 0 limpia el badge según la spec
      return true;
    }
  } catch {
    /* API no soportada o denegada: ignorar */
  }
  return false;
}

/** Sincroniza el badge con el store FSRS; se reactualiza al cambiar, cada minuto y al volver a primer plano. */
export function initBadgeService(): () => void {
  const sync = () => {
    void updateAppBadge(countDueReviews(useAppStore.getState().reviewItems));
  };
  sync();
  const unsub = useAppStore.subscribe((state, prev) => {
    if (state.reviewItems !== prev.reviewItems) sync();
  });
  const timer = setInterval(sync, 60_000);
  const onVisible = () => {
    if (document.visibilityState === 'visible') sync();
  };
  document.addEventListener('visibilitychange', onVisible);
  return () => {
    unsub();
    clearInterval(timer);
    document.removeEventListener('visibilitychange', onVisible);
  };
}
