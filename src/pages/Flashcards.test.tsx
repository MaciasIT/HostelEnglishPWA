import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
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
  beforeEach(() => {
    vi.mocked(useAppStore).mockReturnValue({
      frases: mockFrases,
      loadFrases: vi.fn(),
      frasesLoaded: true,
      categories: mockCategories,
    });
  });

  const renderComponentAndStart = () => {
    render(
      <MemoryRouter>
        <Flashcards />
      </MemoryRouter>
    );
    const startButton = screen.getByText('Empezar a Estudiar');
    fireEvent.click(startButton);
  };

  it('should render the first flashcard by default', () => {
    renderComponentAndStart();
    expect(screen.getByText('Drink Phrase')).toBeInTheDocument();
  });

  it('should navigate to the next and previous flashcard', async () => {
    const user = userEvent.setup();
    renderComponentAndStart();

    // Debería empezar con la primera frase
    expect(screen.getByText('Drink Phrase')).toBeInTheDocument();

    // Clic en Siguiente
    await user.click(screen.getByRole('button', { name: /siguiente/i }));
    expect(screen.getByText('General Phrase')).toBeInTheDocument();

    // Clic en Anterior
    await user.click(screen.getByRole('button', { name: /anterior/i }));
    expect(screen.getByText('Drink Phrase')).toBeInTheDocument();
  });

  it('should filter flashcards by category', async () => {
    const user = userEvent.setup();
    renderComponentAndStart();

    // Seleccionar categoría 'Recepción'
    await user.selectOptions(screen.getByRole('combobox'), 'Recepción');

    // Solo la frase de recepción debería ser visible
    expect(screen.getByText('Reception Phrase')).toBeInTheDocument();
    expect(screen.queryByText('Drink Phrase')).not.toBeInTheDocument();
    expect(screen.queryByText('General Phrase')).not.toBeInTheDocument();
  });
});
