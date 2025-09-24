import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PhraseCard from './PhraseCard';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';

// Mock de useAppStore para evitar errores en el test
vi.mock('@/store/useAppStore', () => ({
  useAppStore: vi.fn(() => ({
    prefs: { audioSpeed: 1 },
  })),
}));

describe('<PhraseCard />', () => {
  const mockPhrase = {
    id: 'test-1',
    es: 'Hola Mundo',
    en: 'Hello World',
  };

  it('should render the Spanish and English phrases', () => {
    const handleAdvanceProgress = vi.fn();

    render(
      <PhraseCard
        phrase={mockPhrase}
        onAdvanceProgress={handleAdvanceProgress}
        progressLevel={0}
      />
    );

    // Assert: Comprobamos que los textos están en el documento
    expect(screen.getByText('Hola Mundo')).toBeInTheDocument();
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('should display the "Estudiada" button when isStudied is true', () => {
    const handleAdvanceProgress = vi.fn();

    render(
      <PhraseCard
        phrase={mockPhrase}
        onAdvanceProgress={handleAdvanceProgress}
        progressLevel={1}
      />
    );

    // Assert: Comprobamos que el botón muestra el texto correcto
    expect(screen.getByRole('button', { name: 'Estudiada' })).toBeInTheDocument();
  });

  it('should display the "Marcar como estudiada" button when isStudied is false', () => {
    const handleAdvanceProgress = vi.fn();

    render(
      <PhraseCard
        phrase={mockPhrase}
        onAdvanceProgress={handleAdvanceProgress}
        progressLevel={0}
      />
    );

    // Assert: Comprobamos que el botón muestra el texto correcto
    expect(screen.getByRole('button', { name: 'Marcar como estudiada' })).toBeInTheDocument();
  });

  it('should call onAdvanceProgress with the correct phrase id when the button is clicked', async () => {
    const user = userEvent.setup();
    const handleAdvanceProgress = vi.fn();

    render(
      <PhraseCard
        phrase={mockPhrase}
        onAdvanceProgress={handleAdvanceProgress}
        progressLevel={0}
      />
    );

    // Act: Simulamos el clic del usuario
    const button = screen.getByRole('button', { name: 'Marcar como Estudiada' });
    await user.click(button);

    // Assert: Comprobamos que la función mock fue llamada
    expect(handleAdvanceProgress).toHaveBeenCalledOnce();
    expect(handleAdvanceProgress).toHaveBeenCalledWith(mockPhrase.id);
  });
});
