import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

import { useLocalLLM } from '@/hooks/useLocalLLM';
import { useAudioManager } from '@/hooks/useAudioManager';
import useSpeechRecognition from '@/hooks/useSpeechRecognition';

import { useRoleplayController } from './useRoleplayController';
import { getScenario } from './scenarios';

vi.mock('@/hooks/useLocalLLM');
vi.mock('@/hooks/useAudioManager');
vi.mock('@/hooks/useSpeechRecognition');

const mockLoad = vi.fn();
const mockGenerate = vi.fn();
const mockReset = vi.fn();
const mockSpeak = vi.fn();
const mockCancel = vi.fn();
const mockStartListening = vi.fn();
const mockStopListening = vi.fn();

const ownScenario = getScenario('checkin')!;

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
      fullText: 'Of course, let me check right away.',
      elapsedMs: 1,
    }),
    abort: vi.fn(),
    reset: mockReset.mockResolvedValue(undefined),
  } as unknown as ReturnType<typeof useLocalLLM>);

  vi.mocked(useAudioManager).mockReturnValue({
    speak: mockSpeak.mockResolvedValue({ engine: 'web-speech', ok: true, attempted: ['web-speech'] }),
    cancel: mockCancel,
    preload: vi.fn(async () => {}),
    status: 'idle',
    waveformState: 'idle',
    engine: 'web-speech',
  } as unknown as ReturnType<typeof useAudioManager>);

  vi.mocked(useSpeechRecognition).mockReturnValue({
    isListening: false,
    transcript: '',
    startListening: mockStartListening,
    stopListening: mockStopListening,
    browserSupportsSpeechRecognition: true,
    error: null,
    requestingPermission: false,
  });
});

describe('useRoleplayController', () => {
  it('start carga el modelo, presenta la apertura y la sintetiza', async () => {
    const { result } = renderHook(() => useRoleplayController(ownScenario));

    await act(async () => {
      await result.current.actions.start();
    });

    expect(mockLoad).toHaveBeenCalledTimes(1);
    expect(result.current.phase).toBe('prompting');
    expect(result.current.turns[0]).toEqual({ role: 'client', text: ownScenario.openingLine });
    expect(mockSpeak).toHaveBeenCalledWith(
      ownScenario.openingLine,
      expect.objectContaining({ language: 'en' }),
    );
  });

  it('genera una respuesta del cliente cuando el objetivo aún no se cumple', async () => {
    const { result } = renderHook(() => useRoleplayController(ownScenario));
    await act(async () => {
      await result.current.actions.start();
    });

    await act(async () => {
      result.current.actions.submitText('Could I see your reservation and passport?');
    });

    // 2 términos (< 3): no completa, llama al LLM y añade la respuesta del cliente.
    expect(result.current.phase).toBe('prompting');
    expect(mockGenerate).toHaveBeenCalledTimes(1);
    expect(result.current.turns[result.current.turns.length - 1].role).toBe('client');
  });

  it('completa la sesión al resolver en el mínimo de turnos con el vocabulario esperado', async () => {
    const { result } = renderHook(() => useRoleplayController(ownScenario));
    await act(async () => {
      await result.current.actions.start();
    });

    await act(async () => {
      result.current.actions.submitText('Could I see your reservation and passport?');
    });
    await act(async () => {
      result.current.actions.submitText('Let me check the availability of a room.');
    });
    await act(async () => {
      result.current.actions.submitText(
        "We have a room available and I apologise. Here is your confirmation.",
      );
    });

    expect(result.current.phase).toBe('completed');
    expect(result.current.result?.objectiveMet).toBe(true);
    expect(result.current.result?.turnsUsed).toBe(3);
    expect(result.current.result?.foundVocabulary).toEqual(
      expect.arrayContaining(['room', 'apologise', 'confirmation']),
    );
  });

  it('procesa la transcripción final del ASR como un turno del alumno', async () => {
    const { result, rerender } = renderHook(
      ({ scenario }) => useRoleplayController(scenario),
      { initialProps: { scenario: ownScenario } },
    );

    await act(async () => {
      await result.current.actions.start();
    });
    expect(result.current.phase).toBe('prompting');

    // El ASR "escucha" y entrega la transcripción final.
    vi.mocked(useSpeechRecognition).mockReturnValue({
      isListening: false,
      transcript: 'Could I see your reservation and passport?',
      startListening: mockStartListening,
      stopListening: mockStopListening,
      browserSupportsSpeechRecognition: true,
      error: null,
      requestingPermission: false,
    });
    rerender({ scenario: ownScenario });

    await waitFor(() => {
      expect(result.current.turns.some((t) => t.role === 'user')).toBe(true);
    });
    expect(mockGenerate).toHaveBeenCalled();
  });

  it('toggleListening alterna entre iniciar y detener el reconocimiento', async () => {
    const { result, rerender } = renderHook(
      ({ scenario }) => useRoleplayController(scenario),
      { initialProps: { scenario: ownScenario } },
    );

    act(() => result.current.actions.toggleListening());
    expect(mockStartListening).toHaveBeenCalledTimes(1);

    vi.mocked(useSpeechRecognition).mockReturnValue({
      isListening: true,
      transcript: '',
      startListening: mockStartListening,
      stopListening: mockStopListening,
      browserSupportsSpeechRecognition: true,
      error: null,
      requestingPermission: false,
    });
    rerender({ scenario: ownScenario });

    act(() => result.current.actions.toggleListening());
    expect(mockStopListening).toHaveBeenCalledTimes(1);
  });

  it('si load falla (sin WebGPU/offline), inicia igualmente en fase prompting sin bloquearse', async () => {
    mockLoad.mockRejectedValueOnce(new Error('WebGPU unsupported'));
    const { result } = renderHook(() => useRoleplayController(ownScenario));

    await act(async () => {
      await result.current.actions.start();
    });

    expect(result.current.phase).toBe('prompting');
    expect(result.current.turns[0]).toEqual({ role: 'client', text: ownScenario.openingLine });
    expect(result.current.error).toBeNull();
  });

  it('si generate falla, recurre a la respuesta procedural sin arrojar error al usuario', async () => {
    mockGenerate.mockRejectedValueOnce(new Error('Inference failure'));
    const { result } = renderHook(() => useRoleplayController(ownScenario));

    await act(async () => {
      await result.current.actions.start();
    });

    await act(async () => {
      result.current.actions.submitText('May I see your booking confirmation?');
    });

    expect(result.current.phase).toBe('prompting');
    expect(result.current.error).toBeNull();
    const lastTurn = result.current.turns[result.current.turns.length - 1];
    expect(lastTurn.role).toBe('client');
    expect(lastTurn.text.length).toBeGreaterThan(5);
  });
});

describe('useRoleplayController — asistencia (FC-04)', () => {
  it('muestra la pista pasados 8 segundos de inactividad en fase de espera', async () => {
    vi.useFakeTimers();
    try {
      const { result } = renderHook(() => useRoleplayController(ownScenario));
      await act(async () => {
        await result.current.actions.start();
      });

      expect(result.current.phase).toBe('prompting');
      expect(result.current.hintVisible).toBe(false);

      act(() => {
        vi.advanceTimersByTime(8000);
      });

      expect(result.current.hintVisible).toBe(true);
      expect(result.current.hint).not.toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('no muestra la pista antes de los 8 segundos', async () => {
    vi.useFakeTimers();
    try {
      const { result } = renderHook(() => useRoleplayController(ownScenario));
      await act(async () => {
        await result.current.actions.start();
      });

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(result.current.hintVisible).toBe(false);
      expect(result.current.hint).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('descartar la pista la oculta', async () => {
    vi.useFakeTimers();
    try {
      const { result } = renderHook(() => useRoleplayController(ownScenario));
      await act(async () => {
        await result.current.actions.start();
      });

      act(() => {
        vi.advanceTimersByTime(8000);
      });
      expect(result.current.hintVisible).toBe(true);

      act(() => result.current.actions.dismissHint());
      expect(result.current.hintVisible).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it('oculta la pista al recibir un turno del alumno', async () => {
    vi.useFakeTimers();
    try {
      const { result } = renderHook(() => useRoleplayController(ownScenario));
      await act(async () => {
        await result.current.actions.start();
      });

      act(() => {
        vi.advanceTimersByTime(8000);
      });
      expect(result.current.hintVisible).toBe(true);

      act(() => {
        result.current.actions.submitText('Could I see your reservation?');
      });
      expect(result.current.hintVisible).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it('detecta una descortesía y expone la corrección post-turno', async () => {
    const { result } = renderHook(() => useRoleplayController(ownScenario));
    await act(async () => {
      await result.current.actions.start();
    });

    await act(async () => {
      result.current.actions.submitText('Give me the menu.');
    });

    expect(result.current.turnFeedback).not.toBeNull();
    expect(result.current.turnFeedback?.issues).toEqual(
      expect.arrayContaining([expect.objectContaining({ label: 'give me' })]),
    );
  });

  it('no emite corrección cuando el turno es cortés', async () => {
    const { result } = renderHook(() => useRoleplayController(ownScenario));
    await act(async () => {
      await result.current.actions.start();
    });

    await act(async () => {
      result.current.actions.submitText('Could you please help me find my reservation?');
    });

    expect(result.current.turnFeedback).toBeNull();
  });

  it('calcula el resumen de feedback al completar la sesión', async () => {
    const { result } = renderHook(() => useRoleplayController(ownScenario));
    await act(async () => {
      await result.current.actions.start();
    });

    await act(async () => {
      result.current.actions.submitText('Could I see your reservation and passport?');
    });
    await act(async () => {
      result.current.actions.submitText('Let me check the availability of a room.');
    });
    await act(async () => {
      result.current.actions.submitText(
        "We have a room available and I apologise. Here is your confirmation.",
      );
    });

    expect(result.current.phase).toBe('completed');
    expect(result.current.feedbackSummary).not.toBeNull();
    expect(result.current.feedbackSummary?.technicalVocabularyUsed).toEqual(
      expect.arrayContaining(['room', 'apologise', 'confirmation', 'reservation', 'passport']),
    );
  });
});