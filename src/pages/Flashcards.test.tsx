import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Flashcards from './Flashcards';
import { useAppStore } from '@/store/useAppStore';
import React from 'react';

// Mock del store de Zustand
vi.mock('@/store/useAppStore');

const mockFrases = [
  { id: 1, es: 'Frase de Bebidas', en: 'Drink Phrase', categoria: 'Bebidas' },
  { id: 2, es: 'Frase General', en: 'General Phrase', categoria: 'General' },
  { id: 3, es: 'Frase de Recepción', en: 'Reception Phrase', categoria: 'Recepción' },
];

const mockCategories = ['Bebidas', 'General', 'Recepción'];

describe('<Flashcards />', () => {
  const mockState = {
    frases: mockFrases,
    loadFrases: vi.fn(),
    frasesLoaded: true,
    categories: mockCategories,
    prefs: {
      targetLanguage: 'en',
      phraseSettings: { voiceURI: '', rate: 1, pitch: 1 },
    },
    setPhraseSetting: vi.fn(),
    closeSideNav: vi.fn(),
  };

  beforeEach(() => {
    vi.mocked(useAppStore).mockImplementation((selector: any) => {
      if (typeof selector === 'function') return selector(mockState);
      return mockState;
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  const renderComponentAndStart = () => {
    render(
      <MemoryRouter>
        <Flashcards />
      </MemoryRouter>
    );
    const startButton = screen.getByText(/Empezar Ahora/i);
    fireEvent.click(startButton);
  };

  it('should render the first flashcard by default', () => {
    renderComponentAndStart();
    expect(screen.getByText(/"Drink Phrase"/i)).toBeInTheDocument();
  });

  it('should navigate to the next and previous flashcard', async () => {
    const user = userEvent.setup();
    renderComponentAndStart();

    // Debería empezar con la primera frase
    expect(screen.getByText(/"Drink Phrase"/i)).toBeInTheDocument();

    // Clic en Siguiente
    await user.click(screen.getByRole('button', { name: /siguiente/i }));
    expect(screen.getByText(/"General Phrase"/i)).toBeInTheDocument();

    // Clic en Anterior
    await user.click(screen.getByRole('button', { name: /anterior/i }));
    expect(screen.getByText(/"Drink Phrase"/i)).toBeInTheDocument();
  });

  it('should filter flashcards by category', async () => {
    const user = userEvent.setup();
    renderComponentAndStart();

    // Seleccionar categoría 'Recepción'
    await user.selectOptions(screen.getByRole('combobox'), 'Recepción');

    // Solo la frase de recepción debería ser visible
    expect(screen.getByText(/"Reception Phrase"/i)).toBeInTheDocument();
    expect(screen.queryByText(/"Drink Phrase"/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/"General Phrase"/i)).not.toBeInTheDocument();
  });
});
