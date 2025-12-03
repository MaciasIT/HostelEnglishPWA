import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Frases from './Frases';
import { useAppStore } from '@/store/useAppStore';
import { MemoryRouter } from 'react-router-dom';

// Mock a parte del store para evitar warnings de Zustand
vi.mock('@/store/useAppStore');

const mockFrases = [
  { id: '1', es: 'Hola', en: 'Hello', categoria: 'Saludos' },
  { id: '2', es: 'Adiós', en: 'Goodbye', categoria: 'Saludos' },
  { id: '3', es: 'Gracias', en: 'Thank you', categoria: 'General' },
];

const mockState = {
  frases: mockFrases,
  loadFrases: vi.fn(),
  progress: {},
  advancePhraseProgress: vi.fn(),
  categories: ['Saludos', 'General'],
  activePhraseSet: mockFrases, // Simula una sesión activa
  setActivePhraseSet: vi.fn(),
  prefs: {
    phraseSettings: {
      voiceURI: 'mock-voice',
      rate: 1,
      pitch: 1,
    },
  },
  setPhraseSetting: vi.fn(),
};

// --- Helper para renderizar con estado inicial ---
const renderFrasesComponent = (initialState = mockState) => {
  vi.mocked(useAppStore).mockImplementation((selector) => {
    if (selector) {
      return selector(initialState);
    }
    return initialState;
  });

  render(
    <MemoryRouter>
      <Frases />
    </MemoryRouter>
  );
};

describe('Frases Page', () => {

  afterEach(() => {
    cleanup(); // Limpia el DOM de JSDOM
    vi.clearAllMocks(); // Resetea los mocks de Vitest
  });

  it('debería renderizar la primera frase al empezar una sesión', () => {
    renderFrasesComponent();
    fireEvent.click(screen.getByText('Empezar a Aprender'));
    fireEvent.click(screen.getByText('Estudiar Todas'));

    expect(screen.getByText('Hola')).toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.queryByText('Adiós')).not.toBeInTheDocument();
  });

  it('debería mostrar la siguiente frase al hacer clic en el botón de siguiente', () => {
    renderFrasesComponent();
    fireEvent.click(screen.getByText('Empezar a Aprender'));
    fireEvent.click(screen.getByText('Estudiar Todas'));

    const nextButton = screen.getByLabelText('Siguiente frase');
    fireEvent.click(nextButton);

    expect(screen.getByText('Adiós')).toBeInTheDocument();
    expect(screen.getByText('Goodbye')).toBeInTheDocument();
    expect(screen.queryByText('Hola')).not.toBeInTheDocument();
  });

  it('debería mostrar la frase anterior al hacer clic en el botón de anterior', () => {
    renderFrasesComponent();
    fireEvent.click(screen.getByText('Empezar a Aprender'));
    fireEvent.click(screen.getByText('Estudiar Todas'));

    const nextButton = screen.getByLabelText('Siguiente frase');
    fireEvent.click(nextButton); // Vamos a la segunda frase

    const prevButton = screen.getByLabelText('Frase anterior');
    fireEvent.click(prevButton); // Volvemos a la primera

    expect(screen.getByText('Hola')).toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('debería el carrusel ser circular y pasar de la última a la primera frase', () => {
    renderFrasesComponent();
    fireEvent.click(screen.getByText('Empezar a Aprender'));
    fireEvent.click(screen.getByText('Estudiar Todas'));
    
    const nextButton = screen.getByLabelText('Siguiente frase');
    fireEvent.click(nextButton); // -> 2
    fireEvent.click(nextButton); // -> 3
    fireEvent.click(nextButton); // -> 1 (debería volver al inicio)

    expect(screen.getByText('Hola')).toBeInTheDocument();
  });

  it('debería expandir y colapsar los ajustes de voz', () => {
    // Para este test, la sesión no debe estar activa al inicio
    const initialStateWithoutActiveSession = {
      ...mockState,
      activePhraseSet: [], // Sin sesión activa
    };
    renderFrasesComponent(initialStateWithoutActiveSession);
    fireEvent.click(screen.getByText('Empezar a Aprender'));

    const voiceSettingsTitle = screen.getByText('Ajustes de Voz');
    // Inicialmente, los controles no son visibles
    expect(screen.queryByText(/Velocidad:/)).not.toBeInTheDocument();

    // Al hacer clic, se expande
    fireEvent.click(voiceSettingsTitle);
    expect(screen.getByText(/Velocidad:/)).toBeInTheDocument();
    expect(screen.getByText(/Tono:/)).toBeInTheDocument();

    // Al volver a hacer clic, se colapsa
    fireEvent.click(voiceSettingsTitle);
    expect(screen.queryByText(/Velocidad:/)).not.toBeInTheDocument();
  });
});