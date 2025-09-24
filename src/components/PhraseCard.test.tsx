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
    // Arrange: Preparamos una función mock para la prop onToggleStudied
    const handleToggleStudied = vi.fn();

    render(
      <PhraseCard
        phrase={mockPhrase}
        onToggleStudied={handleToggleStudied}
        isStudied={false}
      />
    );

    // Assert: Comprobamos que los textos están en el documento
    expect(screen.getByText('Hola Mundo')).toBeInTheDocument();
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('should display the "Estudiada" button when isStudied is true', () => {
    const handleToggleStudied = vi.fn();

    render(
      <PhraseCard
        phrase={mockPhrase}
        onToggleStudied={handleToggleStudied}
        isStudied={true}
      />
    );

    // Assert: Comprobamos que el botón muestra el texto correcto
    expect(screen.getByRole('button', { name: 'Estudiada' })).toBeInTheDocument();
  });

  it('should display the "Marcar como estudiada" button when isStudied is false', () => {
    const handleToggleStudied = vi.fn();

    render(
      <PhraseCard
        phrase={mockPhrase}
        onToggleStudied={handleToggleStudied}
        isStudied={false}
      />
    );

    // Assert: Comprobamos que el botón muestra el texto correcto
    expect(screen.getByRole('button', { name: 'Marcar como estudiada' })).toBeInTheDocument();
  });

  it('should call onToggleStudied with the correct phrase id when the button is clicked', async () => {
    const user = userEvent.setup();
    const handleToggleStudied = vi.fn();

    render(
      <PhraseCard
        phrase={mockPhrase}
        onToggleStudied={handleToggleStudied}
        isStudied={false}
      />
    );

    // Act: Simulamos el clic del usuario
    const button = screen.getByRole('button', { name: 'Marcar como estudiada' });
    await user.click(button);

    // Assert: Comprobamos que la función mock fue llamada
    expect(handleToggleStudied).toHaveBeenCalledOnce();
    expect(handleToggleStudied).toHaveBeenCalledWith(mockPhrase.id);
  });
});
