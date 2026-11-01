import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router';

import Roleplay from './Roleplay';
import { useLocalLLM } from '@/hooks/useLocalLLM';
import { useAudioManager } from '@/hooks/useAudioManager';
import useSpeechRecognition from '@/hooks/useSpeechRecognition';
import { CANONICAL_ROLEPLAY_SCENARIOS, resolveScenarioMeta } from '@/features/roleplay/scenarios';

vi.mock('@/hooks/useLocalLLM');
vi.mock('@/hooks/useAudioManager');
vi.mock('@/hooks/useSpeechRecognition');

const mockLoad = vi.fn();
const mockGenerate = vi.fn();
const mockSpeak = vi.fn();

const checkin = CANONICAL_ROLEPLAY_SCENARIOS[0];
const checkinTitle = resolveScenarioMeta(checkin.key).title;

beforeEach(() => {
  vi.clearAllMocks();

  vi.mocked(useLocalLLM).mockReturnValue({
    status: 'ready',
    progress: null,
    partialText: '',
    capability: null,
    error: null,
    detect: vi.fn(async () => null),
    load: mockLoad.mockResolvedValue(undefined),
    generate: mockGenerate.mockResolvedValue({
      id: 'gen-1',
      fullText: 'Let me check right away, sir.',
      elapsedMs: 1,
    }),
    abort: vi.fn(),
    reset: vi.fn(async () => {}),
  } as unknown as ReturnType<typeof useLocalLLM>);

  vi.mocked(useAudioManager).mockReturnValue({
    speak: mockSpeak.mockResolvedValue({ engine: 'web-speech', ok: true, attempted: ['web-speech'] }),
    cancel: vi.fn(),
    preload: vi.fn(async () => {}),
    status: 'idle',
    waveformState: 'idle',
    engine: 'web-speech',
  } as unknown as ReturnType<typeof useAudioManager>);

  vi.mocked(useSpeechRecognition).mockReturnValue({
    isListening: false,
    transcript: '',
    startListening: vi.fn(),
    stopListening: vi.fn(),
    browserSupportsSpeechRecognition: true,
    error: null,
    requestingPermission: false,
  });
});

afterEach(() => cleanup());

const renderPage = () =>
  render(
    <MemoryRouter>
      <Roleplay />
    </MemoryRouter>,
  );

describe('<Roleplay />', () => {
  it('muestra la intro con el título del módulo', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /Roleplay Conversacional/i })).toBeInTheDocument();
  });

  it('lista los 5 escenarios canónicos tras empezar', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: /Empezar Ahora/i }));

    for (const scenario of CANONICAL_ROLEPLAY_SCENARIOS) {
      const meta = resolveScenarioMeta(scenario.key);
      expect(screen.getByRole('button', { name: new RegExp(meta.title, 'i') })).toBeInTheDocument();
    }
  });

  it('presenta el objetivo y permite comenzar la conversación', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: /Empezar Ahora/i }));
    await user.click(screen.getByRole('button', { name: new RegExp(checkinTitle, 'i') }));

    expect(screen.getByRole('button', { name: /COMENZAR CONVERSACIÓN/i })).toBeInTheDocument();
    expect(screen.getByText(checkin.objective)).toBeInTheDocument();
  });

  it('arranca la conversación y muestra la apertura del cliente', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: /Empezar Ahora/i }));
    await user.click(screen.getByRole('button', { name: new RegExp(checkinTitle, 'i') }));
    await user.click(screen.getByRole('button', { name: /COMENZAR CONVERSACIÓN/i }));

    expect(await screen.findByText(checkin.openingLine)).toBeInTheDocument();
    expect(mockLoad).toHaveBeenCalledTimes(1);
    expect(mockSpeak).toHaveBeenCalledWith(
      checkin.openingLine,
      expect.objectContaining({ language: 'en' }),
    );
  });
});