import { render, screen } from '@testing-library/react';
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

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <Flashcards />
      </MemoryRouter>
    );
  };

  it('should render the first flashcard by default', () => {
    renderComponent();
  expect(screen.getAllByText('Drink Phrase')[0]).to.exist;
  });

  it('should navigate to the next and previous flashcard', async () => {
    const user = userEvent.setup();
    renderComponent();

    // Debería empezar con la primera frase
  expect(screen.getAllByText('Drink Phrase')[0]).to.exist;

    // Clic en Siguiente
  const nextButtons = screen.getAllByRole('button', { name: /siguiente/i });
  await user.click(nextButtons[nextButtons.length - 1]);
  expect(screen.getAllByText('General Phrase')[0]).to.exist;

    // Clic en Anterior
  const prevButtons = screen.getAllByRole('button', { name: /anterior/i });
  await user.click(prevButtons[prevButtons.length - 1]);
  expect(screen.getAllByText('Drink Phrase')[0]).to.exist;
  });

  it('should filter flashcards by category', async () => {
    const user = userEvent.setup();
    renderComponent();

    // Seleccionar categoría 'Recepción'
  const selects = screen.getAllByRole('combobox');
  const categorySelect = selects[selects.length - 1];
  await user.selectOptions(categorySelect, 'Recepción');

  // Solo la frase de recepción debería ser visible en la flashcard actual
  const flashcardWrappers = document.querySelectorAll('.relative.w-full.h-64.rounded-lg.shadow-lg.cursor-pointer.bg-primary.flex.items-center.justify-center.p-4');
  const flashcard = flashcardWrappers[flashcardWrappers.length - 1];
  expect(flashcard.textContent).to.include('Reception Phrase');
  expect(flashcard.textContent).to.not.include('Drink Phrase');
  expect(flashcard.textContent).to.not.include('General Phrase');
  });
});
