import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import BottomNav, { bottomNavTabs } from './BottomNav';

vi.mock('../utils/haptics', () => ({ haptics: { trigger: vi.fn() } }));

const renderAt = (path: string) =>
  render(<MemoryRouter initialEntries={[path]}><BottomNav /></MemoryRouter>);

describe('BottomNav', () => {
  it('renderiza un enlace con icono por cada ruta', () => {
    renderAt('/');
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(bottomNavTabs.length);
    bottomNavTabs.forEach(t => {
      const link = screen.getByRole('link', { name: t.label });
      expect(link.getAttribute('href')).toBe(t.to);
      expect(link.querySelector('svg')).not.toBeNull();
    });
  });

  it('marca la pestaña activa e indicador único', () => {
    renderAt('/quiz');
    expect(screen.getByRole('link', { name: 'Quiz' }).getAttribute('aria-current')).toBe('page');
    expect(screen.getByRole('link', { name: 'Inicio' }).getAttribute('aria-current')).toBeNull();
    expect(screen.getAllByTestId('bottom-nav-indicator')).toHaveLength(1);
  });

  it('usa glassmorphism, safe-area, altura 64px y targets ≥48px', () => {
    renderAt('/');
    const nav = screen.getByTestId('bottom-nav');
    expect(nav.className).toContain('bg-surface/80');
    expect(nav.className).toContain('backdrop-blur-md');
    expect(nav.className).toContain('env(safe-area-inset-bottom,0px)');
    expect(nav.firstElementChild?.className).toContain('h-16');
    expect(screen.getByRole('link', { name: 'Inicio' }).className).toContain('min-h-14');
  });

  it('se oculta al bajar y reaparece al subir', () => {
    renderAt('/');
    const nav = screen.getByTestId('bottom-nav');
    const scrollTo = (y: number) => act(() => {
      Object.defineProperty(window, 'scrollY', { value: y, configurable: true });
      fireEvent.scroll(window);
    });
    scrollTo(300);
    expect(nav.getAttribute('data-hidden')).toBe('true');
    scrollTo(200);
    expect(nav.getAttribute('data-hidden')).toBe('false');
  });
});
