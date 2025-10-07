import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
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

describe('Frases Page', () => {
  beforeEach(() => {
    // Proporciona un estado mockeado para cada test
    vi.mocked(useAppStore).mockReturnValue({
      frases: mockFrases,
      loadFrases: vi.fn(),
      progress: {},
      advancePhraseProgress: vi.fn(),
      categories: ['Saludos', 'General'],
      prefs: {
        phraseSettings: {
          voiceURI: '',
          rate: 1,
          pitch: 1,
        },
      },
      setPhraseSetting: vi.fn(),
    });

    // Forzamos que la pantalla de bienvenida no se muestre para testear la funcionalidad principal
    render(
        <MemoryRouter>
            <Frases />
        </MemoryRouter>
    );
    const startButton = screen.getByText('Empezar a Aprender');
    fireEvent.click(startButton);
  });

  it('debería renderizar la primera frase al cargar', () => {
    expect(screen.getByText('Hola')).toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.queryByText('Adiós')).not.toBeInTheDocument();
  });

  it('debería mostrar la siguiente frase al hacer clic en el botón de siguiente', () => {
    const nextButton = screen.getByLabelText('Siguiente frase');
    fireEvent.click(nextButton);

    expect(screen.getByText('Adiós')).toBeInTheDocument();
    expect(screen.getByText('Goodbye')).toBeInTheDocument();
    expect(screen.queryByText('Hola')).not.toBeInTheDocument();
  });

  it('debería mostrar la frase anterior al hacer clic en el botón de anterior', () => {
    const nextButton = screen.getByLabelText('Siguiente frase');
    fireEvent.click(nextButton); // Vamos a la segunda frase

    const prevButton = screen.getByLabelText('Frase anterior');
    fireEvent.click(prevButton); // Volvemos a la primera

    expect(screen.getByText('Hola')).toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('debería el carrusel ser circular y pasar de la última a la primera frase', () => {
    const nextButton = screen.getByLabelText('Siguiente frase');
    fireEvent.click(nextButton); // -> 2
    fireEvent.click(nextButton); // -> 3
    fireEvent.click(nextButton); // -> 1 (debería volver al inicio)

    expect(screen.getByText('Hola')).toBeInTheDocument();
  });

  it('debería expandir y colapsar los ajustes de voz', () => {
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
