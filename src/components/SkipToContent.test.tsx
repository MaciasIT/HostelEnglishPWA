import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SkipToContent, { MAIN_CONTENT_ID } from './SkipToContent';

describe('SkipToContent', () => {
  it('es el primer enlace tabulable y apunta al <main>', () => {
    render(
      <>
        <SkipToContent />
        <main id={MAIN_CONTENT_ID} tabIndex={-1}>contenido</main>
      </>
    );
    const link = screen.getByRole('link', { name: 'Saltar al contenido principal' });
    expect(link.getAttribute('href')).toBe(`#${MAIN_CONTENT_ID}`);
    expect(link.className).toContain('sr-only');
    expect(link.className).toContain('focus:not-sr-only');
  });

  it('al activarlo mueve el foco al <main> sin cambiar la ruta (HashRouter)', () => {
    window.location.hash = '#/quiz';
    render(
      <>
        <SkipToContent />
        <main id={MAIN_CONTENT_ID} tabIndex={-1}>contenido</main>
      </>
    );
    const link = screen.getByRole('link', { name: 'Saltar al contenido principal' });
    const notPrevented = fireEvent.click(link);
    expect(notPrevented).toBe(false); // preventDefault llamado
    expect(document.activeElement).toBe(document.getElementById(MAIN_CONTENT_ID));
    expect(window.location.hash).toBe('#/quiz');
  });

  it('no lanza error si el destino no existe', () => {
    render(<SkipToContent />);
    const onClick = vi.fn();
    const link = screen.getByRole('link', { name: 'Saltar al contenido principal' });
    link.addEventListener('click', onClick);
    expect(() => fireEvent.click(link)).not.toThrow();
    expect(onClick).toHaveBeenCalled();
  });
});
