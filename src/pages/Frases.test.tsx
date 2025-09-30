import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import Frases from './Frases';

// Mock base para Zustand store
const frasesFixture = [
  { id: 1, es: 'Agua con gas', en: 'Sparkling water', categoria: 'Bebidas' },
  { id: 2, es: 'La cuenta, por favor', en: 'The check, please', categoria: 'General' },
  { id: 3, es: 'Habitación doble', en: 'Double room', categoria: 'Recepción' },
];
const categoriasFixture = ['Estudiadas', 'Aprendidas', 'Bebidas', 'General', 'Recepción'];
function createMockStore(overrides = {}) {
  return {
    frases: [...frasesFixture],
    loadFrases: vi.fn(),
    progress: {},
    advancePhraseProgress: vi.fn(),
    // Aseguramos que las categorías incluyan todas las posibles usadas en los tests y en los datos
    categories: ['Estudiadas', 'Aprendidas', 'Bebidas', 'General', 'Recepción'],
    frasesLoaded: true,
    phrasesCurrentPage: 1,
    phrasesPerPage: 10,
    initializeCategories: vi.fn(),
    prefs: {
      phraseSettings: { voiceURI: 'test', rate: 1, pitch: 1 },
    },
    setPhrasesCurrentPage: vi.fn(),
    setPhrasesPerPage: vi.fn(),
    ...overrides,
  };
}

// Mock Zustand store global
let useAppStoreMock;
vi.doMock('@/store/useAppStore', () => ({
  useAppStore: (selector) => {
    const state = useAppStoreMock();
    if (typeof selector === 'function') {
      return selector(state);
    }
    return state;
  },
}));

// Mock completo de idb para evitar errores de indexedDB en tests
vi.mock('idb', () => ({
  openDB: vi.fn(() => Promise.resolve({
    put: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
    setPhrasesCurrentPage: vi.fn(),
    setPhrasesPerPage: vi.fn(),
    objectStoreNames: { contains: vi.fn(() => true) },
    createObjectStore: vi.fn(),
  })),
}));

describe('<Frases />', () => {
  beforeEach(() => {
    // Mock window.speechSynthesis para evitar errores en tests
    globalThis.window.speechSynthesis = {
      getVoices: () => [],
      speak: () => {},
      cancel: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
    } as any;
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <Frases />
      </MemoryRouter>
    );
  };

  it('should render the title, search input, category filter, and list of phrases', () => {
    useAppStoreMock = () => createMockStore();
    renderComponent();

    expect(screen.getByRole('heading', { name: /frases/i })).to.exist;
    const searchInputs = screen.getAllByPlaceholderText('Buscar frase...');
    expect(searchInputs[0]).to.exist;
    const categorySelect = screen.getAllByTestId('category-select')[0];
    expect(categorySelect).to.exist;
    expect(screen.getByText((content) => content.includes('Agua con gas'))).to.exist;
    expect(screen.getByText((content) => content.includes('The check, please'))).to.exist;
    expect(screen.getByText((content) => content.includes('Habitación doble'))).to.exist;
  });

  it('should filter phrases based on search term', async () => {
    useAppStoreMock = () => createMockStore();
    const user = userEvent.setup();
    renderComponent();

    const searchInputs = screen.getAllByPlaceholderText('Buscar frase...');
    const searchInput = searchInputs[0];
    await user.type(searchInput, 'agua');

    expect(screen.getByText((content) => content.includes('Agua con gas'))).to.exist;
    expect(screen.queryByText((content) => content.includes('La cuenta, por favor'))).to.not.exist;
    expect(screen.queryByText((content) => content.includes('Habitación doble'))).to.not.exist;
  });

  it('should filter phrases based on selected category', async () => {
    useAppStoreMock = () => createMockStore();
    const user = userEvent.setup();
    renderComponent();

    const categorySelect = screen.getAllByTestId('category-select')[0];
    await user.selectOptions(categorySelect, 'Recepción');

    expect(screen.queryByText((content) => content.includes('Agua con gas'))).to.not.exist;
    expect(screen.queryByText((content) => content.includes('La cuenta, por favor'))).to.not.exist;
    expect(screen.getByText((content) => content.includes('Habitación doble'))).to.exist;
  });

  it('should show only studied phrases when "Estudiadas" category is selected', async () => {
    useAppStoreMock = () => createMockStore({ progress: { '1': 1 } });
    const user = userEvent.setup();
    renderComponent();

    const categorySelect = screen.getAllByTestId('category-select')[0];
    await user.selectOptions(categorySelect, 'Estudiadas');

    expect(screen.getByText((content) => content.includes('Agua con gas'))).to.exist;
    expect(screen.queryByText((content) => content.includes('La cuenta, por favor'))).to.not.exist;
    expect(screen.queryByText((content) => content.includes('Habitación doble'))).to.not.exist;
  });

  it('should show only learned phrases when "Aprendidas" category is selected', async () => {
    useAppStoreMock = () => createMockStore({ progress: { 2: 2 } });
    const user = userEvent.setup();
    renderComponent();

    const categorySelect = screen.getAllByTestId('category-select')[0];
    await user.selectOptions(categorySelect, 'Aprendidas');

    expect(screen.getByText((content) => content.includes('La cuenta, por favor'))).to.exist;
    expect(screen.queryByText((content) => content.includes('Agua con gas'))).to.not.exist;
    expect(screen.queryByText((content) => content.includes('Habitación doble'))).to.not.exist;
  });
});
