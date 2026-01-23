import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PhraseCard from './PhraseCard';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';

// Mock de useAppStore para evitar errores en el test
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

    expect(screen.getByText('"Hola Mundo"')).toBeInTheDocument();
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('should display "Marcar como Estudiada" when progressLevel is 0', () => {
    const handleAdvanceProgress = vi.fn();
    render(<PhraseCard phrase={mockPhrase} onAdvanceProgress={handleAdvanceProgress} progressLevel={0} />);
    expect(screen.getByRole('button', { name: 'Marcar como Estudiada' })).toBeInTheDocument();
  });

  it('should display "Marcar como Aprendida" when progressLevel is 1', () => {
    const handleAdvanceProgress = vi.fn();
    render(<PhraseCard phrase={mockPhrase} onAdvanceProgress={handleAdvanceProgress} progressLevel={1} />);
    expect(screen.getByRole('button', { name: 'Marcar como Aprendida' })).toBeInTheDocument();
  });

  it('should display "Reiniciar Progreso" when progressLevel is 2', () => {
    const handleAdvanceProgress = vi.fn();
    render(<PhraseCard phrase={mockPhrase} onAdvanceProgress={handleAdvanceProgress} progressLevel={2} />);
    expect(screen.getByRole('button', { name: 'Reiniciar Progreso' })).toBeInTheDocument();
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

    const button = screen.getByRole('button', { name: 'Marcar como Estudiada' });
    await user.click(button);

    expect(handleAdvanceProgress).toHaveBeenCalledOnce();
    expect(handleAdvanceProgress).toHaveBeenCalledWith(mockPhrase.id);
  });
});
