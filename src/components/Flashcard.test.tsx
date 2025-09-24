import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import Flashcard from './Flashcard';
import React from 'react';

// Mock de useAppStore para aislar el componente
vi.mock('@/store/useAppStore', () => ({
  useAppStore: vi.fn(() => ({
    prefs: { audioSpeed: 1 },
  })),
}));

describe('<Flashcard />', () => {
  const mockPhrase = {
    id: 'flash-1',
    es: 'Tarjeta de prueba',
    en: 'Test card',
  };

  it('should render the front face (English) by default', () => {
    render(<Flashcard phrase={mockPhrase} />);

    expect(screen.getByText('Test card')).toBeInTheDocument();
    expect(screen.queryByText('Tarjeta de prueba')).not.toBeInTheDocument();
  });

  it('should flip from front to back on click', async () => {
    const user = userEvent.setup();
    render(<Flashcard phrase={mockPhrase} />);

    const frontText = screen.getByText('Test card');
    await user.click(frontText);

    expect(screen.getByText('Tarjeta de prueba')).toBeInTheDocument();
    expect(screen.queryByText('Test card')).not.toBeInTheDocument();
  });

  it('should flip back to front on a second click', async () => {
    const user = userEvent.setup();
    render(<Flashcard phrase={mockPhrase} />);

    const cardElement = screen.getByText('Test card');

    // Primer clic
    await user.click(cardElement);
    const backText = await screen.findByText('Tarjeta de prueba');

    // Segundo clic
    await user.click(backText);
    expect(screen.getByText('Test card')).toBeInTheDocument();
    expect(screen.queryByText('Tarjeta de prueba')).not.toBeInTheDocument();
  });
});
