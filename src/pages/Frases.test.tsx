import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Frases from './Frases';
import { useAppStore } from '@/store/useAppStore';
import React from 'react';

// Mock del store de Zustand
vi.mock('@/store/useAppStore');

const mockFrases = [
  { id: 1, es: 'Agua con gas', en: 'Sparkling water', categoria: 'Bebidas' },
  { id: 2, es: 'La cuenta, por favor', en: 'The check, please', categoria: 'General' },
  { id: 3, es: 'Habitación doble', en: 'Double room', categoria: 'Recepción' },
];

const mockCategories = ['Bebidas', 'General', 'Recepción'];

describe('<Frases />', () => {
  beforeEach(() => {
    // Reseteamos el mock antes de cada test
    vi.mocked(useAppStore).mockReturnValue({
      frases: mockFrases,
      loadFrases: vi.fn(),
      progress: {},
      togglePhraseStudied: vi.fn(),
      categories: mockCategories,
    });
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <Frases />
      </MemoryRouter>
    );
  };

  it('should render the title, search input, category filter, and list of phrases', () => {
    renderComponent();

    expect(screen.getByRole('heading', { name: /frases/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Buscar frase...')).toBeInTheDocument();
    expect(screen.getByLabelText(/filtrar por categoría:/i)).toBeInTheDocument();

    // Verifica que todas las frases mockeadas se rendericen
    expect(screen.getByText('Agua con gas')).toBeInTheDocument();
    expect(screen.getByText('The check, please')).toBeInTheDocument();
    expect(screen.getByText('Habitación doble')).toBeInTheDocument();
  });

  it('should filter phrases based on search term', async () => {
    const user = userEvent.setup();
    renderComponent();

    const searchInput = screen.getByPlaceholderText('Buscar frase...');
    await user.type(searchInput, 'agua');

    expect(screen.getByText('Agua con gas')).toBeInTheDocument();
    expect(screen.queryByText('La cuenta, por favor')).not.toBeInTheDocument();
    expect(screen.queryByText('Habitación doble')).not.toBeInTheDocument();
  });

  it('should filter phrases based on selected category', async () => {
    const user = userEvent.setup();
    renderComponent();

    const categorySelect = screen.getByLabelText(/filtrar por categoría:/i);
    await user.selectOptions(categorySelect, 'Recepción');

    expect(screen.queryByText('Agua con gas')).not.toBeInTheDocument();
    expect(screen.queryByText('La cuenta, por favor')).not.toBeInTheDocument();
    expect(screen.getByText('Habitación doble')).toBeInTheDocument();
  });
});
