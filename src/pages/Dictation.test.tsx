import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Dictation from './Dictation';
import { useAppStore } from '@/store/useAppStore';
import useSpeechRecognition from '@/hooks/useSpeechRecognition';

vi.mock('@/store/useAppStore');

// Variable para almacenar el callback onResult
let onResultCallback: (result: string) => void = () => {};

vi.mock('@/hooks/useSpeechRecognition', () => {
  const mock = vi.fn(options => {
    if (options && options.onResult) {
      onResultCallback = options.onResult;
    }
    return {
      isListening: false,
      transcript: '',
      startListening: vi.fn(),
      stopListening: vi.fn(),
      browserSupportsSpeechRecognition: true,
      error: null,
    };
  });
  return { default: mock };
});

const mockFrases = [
  { id: 1, es: 'Hola', en: 'Hello' },
  { id: 2, es: 'Adiós', en: 'Goodbye' },
];

describe('<Dictation />', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAppStore).mockImplementation((selector) => {
      const state = {
        frases: mockFrases,
        loadFrases: vi.fn(),
        closeSideNav: vi.fn(),
        prefs: {
          phraseSettings: {
            voiceURI: '',
            rate: 1,
            pitch: 1,
          },
        },
        setPhraseSetting: vi.fn(),
      };
      if (typeof selector === 'function') {
        return selector(state);
      }
      return state;
    });
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <Dictation />
      </MemoryRouter>
    );
  };

  it('should render the welcome screen correctly', () => {
    renderComponent();
    expect(screen.getByRole('heading', { name: /Módulo de Dictado/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Empezar a Practicar/i })).toBeInTheDocument();
  });

  it('should call speech synthesis with the correct phrase when play is clicked', async () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0);
    const user = userEvent.setup();
    renderComponent();

    await user.click(screen.getByRole('button', { name: /Empezar a Practicar/i }));
    await screen.findByPlaceholderText(/Escribe lo que escuchas/i);

    const playButton = await screen.findByRole('button', { name: /reproducir audio/i });
    await user.click(playButton);

    expect(window.speechSynthesis.speak).toHaveBeenCalled();
    const utterance = (window.speechSynthesis.speak as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(utterance.text).toBe(mockFrases[0].en);

    randomSpy.mockRestore();
  });

  it('should show a success message when the user types the correct answer', async () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0);
    const user = userEvent.setup();
    renderComponent();

    await user.click(screen.getByRole('button', { name: /Empezar a Practicar/i }));
    const input = await screen.findByPlaceholderText(/Escribe lo que escuchas/i);

    await user.type(input, mockFrases[0].en);

    const checkButton = screen.getByRole('button', { name: /comprobar/i });
    await user.click(checkButton);

    await waitFor(() => {
      expect(screen.getByText(/¡Correcto!/i)).toBeInTheDocument();
    });

    randomSpy.mockRestore();
  });

  it('should show a failure message for an incorrect answer', async () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0);
    const user = userEvent.setup();
    renderComponent();

    await user.click(screen.getByRole('button', { name: /Empezar a Practicar/i }));
    const input = await screen.findByPlaceholderText(/Escribe lo que escuchas/i);

    await user.type(input, 'wrong answer');

    const checkButton = screen.getByRole('button', { name: /comprobar/i });
    await user.click(checkButton);

    await waitFor(() => {
      expect(screen.getByText(/Inténtalo de nuevo/i)).toBeInTheDocument();
    });

    randomSpy.mockRestore();
  });

  it('should process spoken input and show success message', async () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0);
    const user = userEvent.setup();
    renderComponent();

    await user.click(screen.getByRole('button', { name: /Empezar a Practicar/i }));
    await screen.findByPlaceholderText(/Escribe lo que escuchas/i);

    const microphoneButton = await screen.findByRole('button', { name: /iniciar dictado por voz/i });
    await user.click(microphoneButton);

    // Simula que el reconocimiento de voz devuelve un resultado
    act(() => {
      onResultCallback(mockFrases[0].en);
    });

    // El componente debería reaccionar y mostrar el mensaje de éxito
    await waitFor(() => {
      expect(screen.getByText(/¡Correcto!/i)).toBeInTheDocument();
    });

    randomSpy.mockRestore();
  });
});