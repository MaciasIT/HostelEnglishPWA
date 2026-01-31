import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Dictation from './Dictation';
import { useAppStore } from '@/store/useAppStore';
import useSpeechRecognition from '@/hooks/useSpeechRecognition';

// --- Mocks ---
vi.mock('@/store/useAppStore');
vi.mock('@/hooks/useSpeechRecognition');

const mockFrases = [
  { id: 1, es: 'Hola', en: 'Hello' },
  { id: 2, es: 'Adiós', en: 'Goodbye' },
];

describe('<Dictation />', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();

    vi.mocked(useAppStore).mockImplementation((selector: any) => {
      const state = {
        frases: mockFrases,
        loadFrases: vi.fn(),
        closeSideNav: vi.fn(),
        prefs: {
          targetLanguage: 'en',
          phraseSettings: { voiceURI: '', rate: 1, pitch: 1 },
        },
        setPhraseSetting: vi.fn(),
        progress: {},
        advancePhraseProgress: vi.fn(),
      };
      if (typeof selector === 'function') {
        return selector(state);
      }
      return state;
    });

    vi.mocked(useSpeechRecognition).mockReturnValue({
      isListening: false,
      transcript: '',
      startListening: vi.fn(),
      stopListening: vi.fn(),
      browserSupportsSpeechRecognition: true,
      error: null,
      requestingPermission: false,
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
  });

  it('should call speech synthesis with the correct phrase when play is clicked', async () => {
    renderComponent();
    await user.click(screen.getByRole('button', { name: /Empezar Ahora/i }));

    const playButton = await screen.findByRole('button', { name: /reproducir audio/i });
    await user.click(playButton);

    expect(window.speechSynthesis.speak).toHaveBeenCalled();
    const utterance = (window.speechSynthesis.speak as any).mock.calls[0][0];
    expect(utterance.text).toBe(mockFrases[0].en);
  });

  it('should show a success message when the user types the correct answer', async () => {
    renderComponent();
    await user.click(screen.getByRole('button', { name: /Empezar Ahora/i }));
    const input = await screen.findByPlaceholderText(/Escribe lo que has oído/i);
    await user.type(input, mockFrases[0].en);
    const checkButton = screen.getByRole('button', { name: /COMPROBAR/i });
    await user.click(checkButton);
    expect(await screen.findByText(/¡Absolutamente correcto!/i)).toBeInTheDocument();
  });

  it('should show a failure message for an incorrect answer', async () => {
    renderComponent();
    await user.click(screen.getByRole('button', { name: /Empezar Ahora/i }));
    const input = await screen.findByPlaceholderText(/Escribe lo que has oído/i);
    await user.type(input, 'wrong answer');
    const checkButton = screen.getByRole('button', { name: /COMPROBAR/i });
    await user.click(checkButton);
    expect(await screen.findByText(/¡Casi! Inténtalo una vez más/i)).toBeInTheDocument();
  });

  it('should process spoken input and show success message', async () => {
    vi.mocked(useSpeechRecognition).mockReturnValue({
      isListening: false,
      transcript: 'Hello',
      startListening: vi.fn(),
      stopListening: vi.fn(),
      browserSupportsSpeechRecognition: true,
      error: null,
      requestingPermission: false,
    });

    renderComponent();
    await user.click(screen.getByRole('button', { name: /Empezar Ahora/i }));

    // El useEffect en Dictation.tsx reacciona a transcript cuando isListening pasa a false
    // Como ya empieza así, debería activarse.
    expect(await screen.findByText(/¡Absolutamente correcto!/i)).toBeInTheDocument();
  });
});