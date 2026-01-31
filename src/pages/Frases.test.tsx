import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Frases from './Frases';
import { useAppStore } from '@/store/useAppStore';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

// Mock a parte del store para evitar warnings de Zustand
vi.mock('@/store/useAppStore');
vi.mock('@/utils/shuffle', () => ({
  shuffle: vi.fn((arr) => arr),
}));

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
    targetLanguage: 'en',
    phraseSettings: {
      voiceURI: 'mock-voice',
      rate: 1,
      pitch: 1,
    },
  },
  setPhraseSetting: vi.fn(),
};

// --- Helper para renderizar con estado inicial ---
const renderFrasesComponent = (initialState: any = mockState) => {
  vi.mocked(useAppStore).mockImplementation((selector: any) => {
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
    fireEvent.click(screen.getByText(/Empezar Ahora/i));
    fireEvent.click(screen.getByText('Todas'));

    expect(screen.getByText(/"Hola"/i)).toBeInTheDocument();
  });

  it('debería mostrar la siguiente frase al hacer clic en el botón de siguiente', () => {
    renderFrasesComponent();
    fireEvent.click(screen.getByText(/Empezar Ahora/i));
    fireEvent.click(screen.getByText('Todas'));

    const nextButton = screen.getByLabelText('Siguiente frase');
    fireEvent.click(nextButton);

    expect(screen.getByText(/"Adiós"/i)).toBeInTheDocument();
  });

  it('debería mostrar la frase anterior al hacer clic en el botón de anterior', () => {
    renderFrasesComponent();
    fireEvent.click(screen.getByText(/Empezar Ahora/i));
    fireEvent.click(screen.getByText('Todas'));

    const nextButton = screen.getByLabelText('Siguiente frase');
    fireEvent.click(nextButton); // Vamos a la segunda frase

    const prevButton = screen.getByLabelText('Frase anterior');
    fireEvent.click(prevButton); // Volvemos a la primera

    expect(screen.getByText(/"Hola"/i)).toBeInTheDocument();
  });

  it('debería el carrusel ser circular y pasar de la última a la primera frase', () => {
    renderFrasesComponent();
    fireEvent.click(screen.getByText(/Empezar Ahora/i));
    fireEvent.click(screen.getByText('Todas'));

    const nextButton = screen.getByLabelText('Siguiente frase');
    fireEvent.click(nextButton); // -> 2
    fireEvent.click(nextButton); // -> 3
    fireEvent.click(nextButton); // -> 1 (debería volver al inicio)

    expect(screen.getByText(/"Hola"/i)).toBeInTheDocument();
  });

  it('debería expandir y colapsar los ajustes de voz', () => {
    // Para este test, la sesión no debe estar activa al inicio
    const initialStateWithoutActiveSession = {
      ...mockState,
      activePhraseSet: [], // Sin sesión activa
    };
    renderFrasesComponent(initialStateWithoutActiveSession);
    fireEvent.click(screen.getByText(/Empezar Ahora/i));

    const voiceSettingsTitle = screen.getByText('Ajustes de Voz');
    // Inicialmente, los controles no son visibles
    expect(screen.queryByText(/Velocidad/i)).not.toBeInTheDocument();

    // Al hacer clic, se expande
    fireEvent.click(voiceSettingsTitle);
    expect(screen.getByText(/Velocidad/i)).toBeInTheDocument();
    expect(screen.getByText(/Tono/i)).toBeInTheDocument();

    // Al volver a hacer clic, se colapsa
    fireEvent.click(voiceSettingsTitle);
    expect(screen.queryByText(/Velocidad/i)).not.toBeInTheDocument();
  });
});