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
      advancePhraseProgress: vi.fn(), // Nueva acción
      categories: ['Estudiadas', 'Aprendidas', ...mockCategories], // Nuevas categorías
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

    // Verifica que todas las frases mockeadas se rendericen (las no estudiadas)
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

  it('should show only studied phrases when "Estudiadas" category is selected', async () => {
    const user = userEvent.setup();
    // Mockeamos el store para que una frase esté estudiada
    vi.mocked(useAppStore).mockReturnValue({
      frases: mockFrases,
      loadFrases: vi.fn(),
      progress: { '1': 1 }, // Frase 1 como estudiada
      advancePhraseProgress: vi.fn(),
      categories: ['Estudiadas', 'Aprendidas', ...mockCategories],
    });
    renderComponent();

    const categorySelect = screen.getByLabelText(/filtrar por categoría:/i);
    await user.selectOptions(categorySelect, 'Estudiadas');

    expect(screen.getByText('Agua con gas')).toBeInTheDocument();
    expect(screen.queryByText('La cuenta, por favor')).not.toBeInTheDocument();
    expect(screen.queryByText('Habitación doble')).not.toBeInTheDocument();
  });

  it('should show only learned phrases when "Aprendidas" category is selected', async () => {
    const user = userEvent.setup();
    // Mockeamos el store para que una frase esté aprendida
    vi.mocked(useAppStore).mockReturnValue({
      frases: mockFrases,
      loadFrases: vi.fn(),
      progress: { '2': 2 }, // Frase 2 como aprendida
      advancePhraseProgress: vi.fn(),
      categories: ['Estudiadas', 'Aprendidas', ...mockCategories],
    });
    renderComponent();

    const categorySelect = screen.getByLabelText(/filtrar por categoría:/i);
    await user.selectOptions(categorySelect, 'Aprendidas');

    expect(screen.getByText('La cuenta, por favor')).toBeInTheDocument();
    expect(screen.queryByText('Agua con gas')).not.toBeInTheDocument();
    expect(screen.queryByText('Habitación doble')).not.toBeInTheDocument();
  });
