/**
 * Tests del hook `useWhisperASR` con mock del Web Worker (no se instancia un
 * Worker real en JSDOM). Se verifica:
 *  - degradación suave a Web Speech cuando on-device no es viable;
 *  - correlación de transcripciones por id;
 *  - agregación del porcentaje de descarga;
 *  - aborto y gestión de errores.
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { aggregateDownloadProgress, useWhisperASR } from '@/hooks/useWhisperASR';
import type { ASRCapability } from '@/services/audio/asrCapabilities';
import type { WhisperWorkerResponse } from '@/workers/whisperTypes';

const { mockWorker } = vi.hoisted(() => {
  const postMessage = vi.fn();
  const terminate = vi.fn();
  const worker = {
    postMessage,
    terminate,
    onmessage: null as null | ((event: MessageEvent<WhisperWorkerResponse>) => void),
    onerror: null as null | ((event: unknown) => void),
    emit(data: WhisperWorkerResponse): void {
      this.onmessage?.({ data } as MessageEvent<WhisperWorkerResponse>);
    },
  };
  return { mockWorker: worker };
});

vi.mock('@/workers/whisperWorkerFactory', () => ({
  createWhisperWorker: () => mockWorker,
}));

const supportedCapability: ASRCapability = {
  webgpu: false,
  wasm: true,
  wasmSimd: true,
  worker: true,
  supported: true,
};

const unsupportedCapability: ASRCapability = {
  webgpu: false,
  wasm: true,
  wasmSimd: false,
  worker: true,
  supported: false,
  reason: 'Sin WASM SIMD ni WebGPU: se usará Web Speech.',
};

beforeEach(() => {
  mockWorker.postMessage.mockClear();
  mockWorker.terminate.mockClear();
  mockWorker.onmessage = null;
  mockWorker.onerror = null;
});

describe('useWhisperASR', () => {
  it('detecta ruta no viable y expone el fallback Web Speech', () => {
    const { result } = renderHook(() =>
      useWhisperASR({ detectCapability: () => unsupportedCapability }),
    );
    expect(result.current.supported).toBe(false);
    expect(result.current.engine).toBe('web-speech');
    expect(result.current.status).toBe('unsupported');
  });

  it('transcribe con Web Speech cuando on-device no es viable', async () => {
    const webSpeech = vi.fn().mockResolvedValue('hello from web speech');
    const { result } = renderHook(() =>
      useWhisperASR({ detectCapability: () => unsupportedCapability, webSpeechTranscriber: webSpeech }),
    );

    let text = '';
    await act(async () => {
      text = await result.current.transcribe(new Float32Array([0.1, 0.2]), 'en');
    });

    expect(webSpeech).toHaveBeenCalledWith('en');
    expect(text).toBe('hello from web speech');
    expect(result.current.transcript).toBe('hello from web speech');
    expect(mockWorker.postMessage).not.toHaveBeenCalled();
  });

  it('precarga el modelo y transcribe en el worker correlacionando por id', async () => {
    const { result } = renderHook(() =>
      useWhisperASR({ detectCapability: () => supportedCapability }),
    );

    let textPromise: Promise<string> = Promise.resolve('');
    act(() => {
      textPromise = result.current.transcribe(new Float32Array([0.1, 0.2, 0.3]), 'es');
    });

    await waitFor(() =>
      expect(mockWorker.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'load' }),
      ),
    );

    act(() => {
      mockWorker.emit({ type: 'ready', model: 'whisper-tiny' });
    });

    await waitFor(() =>
      expect(mockWorker.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'transcribe' }),
        expect.anything(),
      ),
    );

    const transcribeCall = mockWorker.postMessage.mock.calls.find(
      (call) => (call[0] as { action?: string })?.action === 'transcribe',
    );
    const id = (transcribeCall![0] as { id: string }).id;
    const language = (transcribeCall![0] as { language: string }).language;
    expect(language).toBe('es');

    await act(async () => {
      mockWorker.emit({
        type: 'transcription',
        id,
        text: 'la cuenta por favor',
        language: 'es',
        latencyMs: 42,
      });
      await textPromise;
    });

    expect(result.current.transcript).toBe('la cuenta por favor');
    expect(result.current.status).toBe('ready');
  });

  it('agrega el progreso de descarga 0..100 a partir de eventos por archivo', async () => {
    const { result } = renderHook(() =>
      useWhisperASR({ detectCapability: () => supportedCapability }),
    );

    act(() => {
      void result.current.load();
    });

    await waitFor(() =>
      expect(mockWorker.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'load' }),
      ),
    );

    act(() => {
      mockWorker.emit({
        type: 'progress',
        progress: { status: 'progress', file: 'encoder.onnx', loaded: 50, total: 100 },
      });
    });
    expect(result.current.downloadProgress).toBe(50);

    act(() => {
      mockWorker.emit({
        type: 'progress',
        progress: { status: 'progress', file: 'decoder.onnx', loaded: 100, total: 100 },
      });
    });
    expect(result.current.downloadProgress).toBe(75);
  });

  it('propaga el error de transcripción y fija el estado error', async () => {
    const { result } = renderHook(() =>
      useWhisperASR({ detectCapability: () => supportedCapability }),
    );

    let textPromise: Promise<string> = Promise.resolve('');
    act(() => {
      textPromise = result.current.transcribe(new Float32Array([0.1]), 'en');
    });

    // El transcribe primero asegura el modelo (load), y tras 'ready' postea.
    await waitFor(() =>
      expect(mockWorker.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'load' }),
      ),
    );
    act(() => {
      mockWorker.emit({ type: 'ready', model: 'whisper-tiny' });
    });

    await waitFor(() =>
      expect(mockWorker.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'transcribe' }),
        expect.anything(),
      ),
    );

    const transcribeCall = mockWorker.postMessage.mock.calls.find(
      (call) => (call[0] as { action?: string })?.action === 'transcribe',
    );
    const id = (transcribeCall![0] as { id: string }).id;

    act(() => {
      mockWorker.emit({ type: 'error', id, code: 'DOWNLOAD_FAILED', message: 'sin red' });
    });

    await expect(textPromise).rejects.toThrow('sin red');
    expect(result.current.error).toBe('sin red');
    expect(result.current.status).toBe('error');
  });

  it('aborta las transcripciones en curso', async () => {
    const { result } = renderHook(() =>
      useWhisperASR({ detectCapability: () => supportedCapability }),
    );

    let textPromise: Promise<string> = Promise.resolve('');
    act(() => {
      textPromise = result.current.transcribe(new Float32Array([0.1]), 'en');
    });

    await waitFor(() =>
      expect(mockWorker.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'load' }),
      ),
    );
    act(() => {
      mockWorker.emit({ type: 'ready', model: 'whisper-tiny' });
    });

    await waitFor(() =>
      expect(mockWorker.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'transcribe' }),
        expect.anything(),
      ),
    );

    act(() => {
      result.current.abort();
    });

    await expect(textPromise).rejects.toThrow('cancelada');
    expect(mockWorker.postMessage).toHaveBeenCalledWith({ action: 'abort' });
  });
});

describe('aggregateDownloadProgress', () => {
  it('agrega los bytes cargados frente al total', () => {
    const files = new Map([
      ['a', { loaded: 50, total: 100 }],
      ['b', { loaded: 100, total: 200 }],
    ]);
    expect(aggregateDownloadProgress(files)).toBe(50); // 150/300
  });

  it('devuelve 0 con un mapa vacío', () => {
    expect(aggregateDownloadProgress(new Map())).toBe(0);
  });

  it('recorta a 100 y no se dispara con total no positivo', () => {
    const files = new Map([
      ['a', { loaded: 500, total: 100 }],
      ['b', { loaded: 0, total: 0 }],
    ]);
    expect(aggregateDownloadProgress(files)).toBe(100);
  });
});