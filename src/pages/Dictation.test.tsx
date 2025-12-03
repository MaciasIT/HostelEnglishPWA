import React from 'react';
import { render, screen, act, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Dictation from './Dictation';
import { useAppStore } from '@/store/useAppStore';
import useSpeechRecognition from '@/hooks/useSpeechRecognition';

// --- Mocks ---
vi.mock('@/store/useAppStore');

const mockUseSpeechRecognition = {
  isListening: false,
  transcript: '',
  startListening: vi.fn(),
  stopListening: vi.fn(),
  browserSupportsSpeechRecognition: true,
  error: null,
  requestingPermission: false,
};
vi.mock('@/hooks/useSpeechRecognition', () => ({
  default: vi.fn(() => mockUseSpeechRecognition),
}));

const mockFrases = [
  { id: 1, es: 'Hola', en: 'Hello' },
  { id: 2, es: 'Adiós', en: 'Goodbye' },
];

describe('<Dictation />', () => {
  let user;

  beforeEach(() => {
    user = userEvent.setup();
    
    // Resetear el estado del mock antes de cada test
    mockUseSpeechRecognition.isListening = false;
    mockUseSpeechRecognition.transcript = '';
    mockUseSpeechRecognition.error = null;

    vi.mocked(useAppStore).mockImplementation((selector) => {
      const state = {
        frases: mockFrases,
        loadFrases: vi.fn(),
        closeSideNav: vi.fn(),
        prefs: {
          phraseSettings: { voiceURI: '', rate: 1, pitch: 1 },
        },
        setPhraseSetting: vi.fn(),
      };
      if (typeof selector === 'function') {
        return selector(state);
      }
      return state;
    });

    vi.spyOn(Math, 'random').mockReturnValue(0);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
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
    renderComponent();
    await user.click(screen.getByRole('button', { name: /Empezar a Practicar/i }));

    const playButton = await screen.findByRole('button', { name: /reproducir audio/i });
    await user.click(playButton);

    expect(window.speechSynthesis.speak).toHaveBeenCalled();
    const utterance = (window.speechSynthesis.speak as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(utterance.text).toBe(mockFrases[0].en);
  });

  it('should show a success message when the user types the correct answer', async () => {
    renderComponent();
    await user.click(screen.getByRole('button', { name: /Empezar a Practicar/i }));
    const input = await screen.findByPlaceholderText(/Escribe lo que escuchas/i);
    await user.type(input, mockFrases[0].en);
    const checkButton = screen.getByRole('button', { name: /comprobar/i });
    await user.click(checkButton);
    expect(await screen.findByText(/¡Correcto!/i)).toBeInTheDocument();
  });

  it('should show a failure message for an incorrect answer', async () => {
    renderComponent();
    await user.click(screen.getByRole('button', { name: /Empezar a Practicar/i }));
    const input = await screen.findByPlaceholderText(/Escribe lo que escuchas/i);
    await user.type(input, 'wrong answer');
    const checkButton = screen.getByRole('button', { name: /comprobar/i });
    await user.click(checkButton);
    expect(await screen.findByText(/Inténtalo de nuevo/i)).toBeInTheDocument();
  });

  it('should process spoken input and show success message', async () => {
    const mockRecognitionHook = vi.mocked(useSpeechRecognition);
    
    // 1. Render inicial
    const { rerender } = renderComponent();

    await user.click(screen.getByRole('button', { name: /Empezar a Practicar/i }));
    await screen.findByPlaceholderText(/Escribe lo que escuchas/i);

    const microphoneButton = screen.getByRole('button', { name: /iniciar dictado por voz/i });
    await user.click(microphoneButton);

    // 2. Simular que el reconocimiento está activo
    act(() => {
        mockRecognitionHook.mockReturnValue({ ...mockUseSpeechRecognition, isListening: true });
    });
    rerender(<MemoryRouter><Dictation /></MemoryRouter>);


    // 3. Simular que el reconocimiento devuelve un resultado y se detiene
    act(() => {
        mockRecognitionHook.mockReturnValue({ ...mockUseSpeechRecognition, transcript: mockFrases[0].en, isListening: false });
    });
    rerender(<MemoryRouter><Dictation /></MemoryRouter>);

    // 4. El useEffect en el componente ahora debería activarse y mostrar el feedback
    expect(await screen.findByText(/¡Correcto!/i)).toBeInTheDocument();
  });
});