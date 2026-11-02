import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { act } from 'react';
import {
  getVisualViewport,
  isFullyVisible,
  scrollIntoVisualView,
  useSmoothFocusScroll,
  KEYBOARD_SETTLE_MS,
} from './useSmoothFocusScroll';

describe('useSmoothFocusScroll', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  /** Crea un <input> real con rect y scrollIntoView controlados. */
  function makeInput(rect: { top: number; bottom: number }, scrollIntoView = vi.fn()) {
    const el = document.createElement('input');
    el.getBoundingClientRect = () =>
      ({ top: rect.top, bottom: rect.bottom, left: 0, right: 0, width: 0, height: 0 } as DOMRect);
    el.scrollIntoView = scrollIntoView as unknown as typeof el.scrollIntoView;
    return { el, scrollIntoView };
  }

  describe('getVisualViewport', () => {
    it('usa visualViewport cuando está disponible', () => {
      vi.stubGlobal('visualViewport', { height: 500, width: 360 });
      expect(getVisualViewport()).toEqual({ height: 500, width: 360 });
    });

    it('cae al viewport de layout cuando no hay visualViewport', () => {
      vi.stubGlobal('visualViewport', undefined);
      vi.stubGlobal('innerHeight', 800);
      vi.stubGlobal('innerWidth', 360);
      expect(getVisualViewport()).toEqual({ height: 800, width: 360 });
    });
  });

  describe('isFullyVisible', () => {
    it('es visible si cabe por completo', () => {
      const el = { getBoundingClientRect: () => ({ top: 10, bottom: 40 }) } as HTMLElement;
      expect(isFullyVisible(el, 800)).toBe(true);
    });

    it('no es visible si el fondo queda por debajo del viewport', () => {
      const el = { getBoundingClientRect: () => ({ top: 700, bottom: 780 }) } as HTMLElement;
      expect(isFullyVisible(el, 500)).toBe(false);
    });

    it('no es visible si el top queda sobre el borde superior', () => {
      const el = { getBoundingClientRect: () => ({ top: -10, bottom: 40 }) } as HTMLElement;
      expect(isFullyVisible(el, 800)).toBe(false);
    });
  });

  describe('scrollIntoVisualView', () => {
    it('no hace scroll si el elemento ya es visible', () => {
      const scrollIntoView = vi.fn();
      const el = {
        getBoundingClientRect: () => ({ top: 0, bottom: 40 }),
        scrollIntoView,
      } as unknown as HTMLElement;
      vi.stubGlobal('visualViewport', { height: 800, width: 360 });
      scrollIntoVisualView(el);
      expect(scrollIntoView).not.toHaveBeenCalled();
    });

    it('hace scroll suave si el elemento queda oculto por el teclado', () => {
      const scrollIntoView = vi.fn();
      const el = {
        getBoundingClientRect: () => ({ top: 700, bottom: 740 }),
        scrollIntoView,
      } as unknown as HTMLElement;
      vi.stubGlobal('visualViewport', { height: 500, width: 360 });
      scrollIntoVisualView(el);
      expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'nearest' });
    });
  });

  describe('useSmoothFocusScroll', () => {
    it('desplaza el input al centro tras el margen del teclado', () => {
      const { el, scrollIntoView } = makeInput({ top: 700, bottom: 740 });
      vi.stubGlobal('visualViewport', { height: 500, width: 360 });

      const { result } = renderHook(() => useSmoothFocusScroll());
      const handler = result.current;

      act(() => {
        handler({ currentTarget: el } as unknown as React.FocusEvent<HTMLElement>);
      });
      expect(scrollIntoView).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(KEYBOARD_SETTLE_MS);
      });
      expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'nearest' });
    });

    it('cancela el scroll pendiente si el input pierde el foco antes', () => {
      const { el, scrollIntoView } = makeInput({ top: 700, bottom: 740 });
      vi.stubGlobal('visualViewport', { height: 500 });

      const { result } = renderHook(() => useSmoothFocusScroll());
      act(() => {
        result.current({ currentTarget: el } as unknown as React.FocusEvent<HTMLElement>);
      });
      // El blur se dispara antes del timer.
      el.dispatchEvent(new Event('blur'));
      act(() => {
        vi.advanceTimersByTime(KEYBOARD_SETTLE_MS);
      });
      expect(scrollIntoView).not.toHaveBeenCalled();
    });
  });
});