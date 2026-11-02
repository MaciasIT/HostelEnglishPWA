import { useCallback } from 'react';

/**
 * Utilidad de teclado virtual (UX-04): garantiza que el input enfocado quede
 * dentro del viewport visual cuando el teclado en pantalla (Android/iOS) lo
 * cubre. El `visualViewport` se encoge al abrirse el teclado sin alterar
 * `window.innerHeight`; sin este scroll, los botones de comprobación/envío
 * pueden quedar ocultos tras el teclado.
 *
 * Estrategia:
 *  1. Dejar un breve margen para que el teclado termine de animarse.
 *  2. Si el elemento no es completamente visible dentro del viewport visual,
 *     desplazarlo suavemente al centro de la zona visible.
 */

/** Margen en ms para que el teclado termine de desplegarse antes de medir. */
export const KEYBOARD_SETTLE_MS = 260;

/**
 * Devuelve las dimensiones del viewport visual (zona no cubierta por el
 * teclado). Si `visualViewport` no existe (desktop), cae al viewport de layout.
 */
export function getVisualViewport(): { height: number; width: number } {
  const vv = window.visualViewport;
  if (vv && typeof vv.height === 'number') {
    return { height: vv.height, width: vv.width };
  }
  return { height: window.innerHeight, width: window.innerWidth };
}

/** Indica si el elemento es visible íntegramente dentro del viewport visual. */
export function isFullyVisible(el: HTMLElement, vh: number): boolean {
  const rect = el.getBoundingClientRect();
  return rect.top >= 0 && rect.bottom <= vh;
}

/**
 * Desplaza el elemento al centro del viewport visual si el teclado lo oculta.
 * `block: 'nearest'` evita saltos bruscos cuando el input ya es visible.
 */
export function scrollIntoVisualView(el: HTMLElement): void {
  const { height } = getVisualViewport();
  if (isFullyVisible(el, height)) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Hook: devuelve un manejador `onFocus` que, tras el `delay` configurable
 * (por defecto `KEYBOARD_SETTLE_MS`), re-coloca el input dentro de la zona
 * visible por encima del teclado virtual.
 */
export function useSmoothFocusScroll(delayMs: number = KEYBOARD_SETTLE_MS) {
  return useCallback(
    (event: React.FocusEvent<HTMLElement>) => {
      const el = event.currentTarget;
      if (!(el instanceof HTMLElement)) return;
      const timer = setTimeout(() => scrollIntoVisualView(el), delayMs);
      el.addEventListener(
        'blur',
        () => clearTimeout(timer),
        { once: true },
      );
    },
    [delayMs],
  );
}