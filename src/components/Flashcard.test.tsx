import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import Flashcard from './Flashcard';
import React from 'react';

// Mock de useAppStore para aislar el componente
vi.mock('@/store/useAppStore', () => ({
  useAppStore: vi.fn((selector) => {
    const mockState = {
      prefs: {
        audioSpeed: 1,
        phraseSettings: { rate: 1, pitch: 1, voiceURI: '' },
        targetLanguage: 'en',
      },
    };
    return selector(mockState);
  }),
}));

describe('<Flashcard />', () => {
  const mockPhrase = {
    id: 'flash-1',
    es: 'Tarjeta de prueba',
    en: 'Test card',
  };

  it('should render both sides and start unflipped', () => {
    render(<Flashcard phrase={mockPhrase} />);

    expect(screen.getByText('"Test card"')).toBeInTheDocument();
    expect(screen.getByText('"Tarjeta de prueba"')).toBeInTheDocument();

    const innerCard = screen.getByTestId('flashcard-inner');
    expect(innerCard).not.toHaveClass('rotate-y-180');
  });

  it('should flip from front to back on click', async () => {
    const user = userEvent.setup();
    render(<Flashcard phrase={mockPhrase} />);

    const card = screen.getByTestId('flashcard-inner');
    await user.click(card); // Click anywhere on the card

    expect(card).toHaveClass('rotate-y-180');
  });

  it('should flip back to front on a second click', async () => {
    const user = userEvent.setup();
    render(<Flashcard phrase={mockPhrase} />);

    const card = screen.getByTestId('flashcard-inner');

    // Primer clic
    await user.click(card);
    expect(card).toHaveClass('rotate-y-180');

    // Segundo clic
    await user.click(card);
    expect(card).not.toHaveClass('rotate-y-180');
  });
});
