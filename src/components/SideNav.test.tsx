import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import SideNav from './SideNav';
import { useAppStore } from '@/store/useAppStore';

const setViewport = (desktop: boolean, tablet: boolean) => {
  window.matchMedia = ((q: string) => ({
    matches: q.includes('1280') ? desktop : q.includes('768') ? tablet : false,
    media: q,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    onchange: null,
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
};

const renderNav = () => render(<MemoryRouter><SideNav /></MemoryRouter>);

describe('SideNav responsive', () => {
  beforeEach(() => {
    useAppStore.setState({ isSideNavOpen: false, isSideNavCollapsed: false });
  });

  it('desktop: expandido (w-72) y colapsable a w-20', () => {
    setViewport(true, true);
    renderNav();
    const aside = screen.getByTestId('sidenav');
    expect(aside.className).toContain('w-72');
    fireEvent.click(screen.getByLabelText('Colapsar menú lateral'));
    expect(useAppStore.getState().isSideNavCollapsed).toBe(true);
    expect(screen.getByTestId('sidenav').className).toContain('w-20');
    expect(screen.getByTestId('sidenav').className).toContain('duration-300');
  });

  it('tablet: rail colapsado y drawer expandido al abrir', () => {
    setViewport(false, true);
    useAppStore.setState({ isSideNavOpen: true });
    renderNav();
    expect(screen.getByTestId('sidenav').className).toContain('w-72');
    expect(screen.getByTestId('sidenav-backdrop')).toBeTruthy();
  });

  it('tablet cerrado: rail w-20', () => {
    setViewport(false, true);
    renderNav();
    expect(screen.getByTestId('sidenav').className).toContain('w-20');
  });

  it('móvil cerrado: fuera de pantalla e inerte (no enfocable)', () => {
    setViewport(false, false);
    renderNav();
    const aside = screen.getByTestId('sidenav');
    expect(aside.className).toContain('-translate-x-full');
    expect(aside.hasAttribute('inert')).toBe(true);
  });
});
