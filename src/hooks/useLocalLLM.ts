/**
 * Hook React que envuelve `LocalLLMEngine` para el módulo de roleplay (FC-03).
 *
 * Proporciona el estado del indicador de carga inicial (`status`, `progress`)
 * y una API de generación con streaming token a token. El componente que lo
 * consuma decide la representación visual (barra de progreso, burbujas, etc.).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { LocalLLMEngine, type LocalLLMEngineConfig, type GenerateCallbacks } from '@/services/llm/localEngine';
import type {
  LLMCapability,
  LLMChatMessage,
  LLMCompletionResult,
  LLMError,
  LLMGenerateOptions,
  LLMLoadProgress,
} from '@/services/llm/llmTypes';

export type LLMStatus = 'idle' | 'detecting' | 'loading' | 'ready' | 'generating' | 'error';

export interface UseLocalLLMResult {
  status: LLMStatus;
  /** Progreso 0..1 de la descarga/carga inicial (null si no hay carga activa). */
  progress: LLMLoadProgress | null;
  /** Texto parcial acumulado de la generación en curso. */
  partialText: string;
  /** Capacidad del dispositivo (decide fallback cloud en FC-08). */
  capability: LLMCapability | null;
  error: LLMError | null;
  /** Detecta soporte WebGPU/Worker sin cargar el modelo. */
  detect: () => Promise<LLMCapability | null>;
  /** Carga el modelo en el worker (con progreso). */
  load: () => Promise<void>;
  /** Genera una respuesta con streaming; actualiza `partialText`. */
  generate: (
    messages: LLMChatMessage[],
    callbacks?: GenerateCallbacks,
    options?: LLMGenerateOptions,
  ) => Promise<LLMCompletionResult>;
  /** Cancela la generación activa y limpia el texto parcial. */
  abort: () => void;
  /** Recomienza el historial del modelo (contexto a cero). */
  reset: () => Promise<void>;
}

export function useLocalLLM(config?: LocalLLMEngineConfig): UseLocalLLMResult {
  const [status, setStatus] = useState<LLMStatus>('idle');
  const [progress, setProgress] = useState<LLMLoadProgress | null>(null);
  const [partialText, setPartialText] = useState('');
  const [capability, setCapability] = useState<LLMCapability | null>(null);
  const [error, setError] = useState<LLMError | null>(null);

  const engineRef = useRef<LocalLLMEngine | null>(null);
  if (!engineRef.current) {
    engineRef.current = new LocalLLMEngine(config);
  }

  // Limpieza al desmontar.
  useEffect(() => {
    const engine = engineRef.current;
    return () => {
      engine?.dispose();
      engineRef.current = null;
    };
  }, []);

  const detect = useCallback(async () => {
    setStatus('detecting');
    setError(null);
    try {
      const cap = await LocalLLMEngine.getCapability();
      setCapability(cap);
      setStatus(cap.supported ? 'idle' : 'error');
      return cap;
    } catch (err) {
      const llmError: LLMError = { code: 'UNKNOWN', message: String(err) };
      setError(llmError);
      setStatus('error');
      return null;
    }
  }, []);

  const load = useCallback(async () => {
    setStatus('loading');
    setProgress({ progress: 0, text: 'Preparando…', timeElapsed: 0 });
    setError(null);
    try {
      await engineRef.current!.load((p) => setProgress(p));
      setStatus('ready');
      setProgress(null);
    } catch (err) {
      const llmError = asLLMError(err);
      setError(llmError);
      setStatus('error');
      throw llmError;
    }
  }, []);

  const generate = useCallback(
    async (
      messages: LLMChatMessage[],
      callbacks?: GenerateCallbacks,
      options?: LLMGenerateOptions,
    ): Promise<LLMCompletionResult> => {
      setStatus('generating');
      setPartialText('');
      setError(null);
      try {
        const result = await engineRef.current!.generate(
          messages,
          {
            onToken: (_token, partial) => setPartialText(partial),
            ...callbacks,
          },
          options,
        );
        setStatus('ready');
        return result;
      } catch (err) {
        const llmError = asLLMError(err);
        setError(llmError);
        setStatus('error');
        throw llmError;
      }
    },
    [],
  );

  const abort = useCallback(() => {
    engineRef.current?.abort();
    setPartialText('');
    setStatus('ready');
  }, []);

  const reset = useCallback(async () => {
    await engineRef.current?.reset();
    setPartialText('');
  }, []);

  return {
    status,
    progress,
    partialText,
    capability,
    error,
    detect,
    load,
    generate,
    abort,
    reset,
  };
}

function asLLMError(err: unknown): LLMError {
  if (err && typeof err === 'object' && 'code' in err && 'message' in err) {
    return err as LLMError;
  }
  return { code: 'UNKNOWN', message: String(err) };
}