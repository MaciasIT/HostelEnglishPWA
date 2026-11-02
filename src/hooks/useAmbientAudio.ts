/**
 * Hook de React para el generador acústico ambiental (PM-02).
 *
 * Envuelve `AmbientAudioEngine` con un ciclo de vida de componente: crea el
 * motor de forma perezosa (el contexto solo se desbloquea dentro de un gesto
 * de usuario, vía `start()`), y lo desmonta por completo al desmontar la vista
 * (`dispose()` → `gainNode.disconnect()` + `context.close()`).
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import {
  AmbientAudioEngine,
  isAmbientAudioSupported,
} from '@/services/audio/ambientAudio';
import type { AmbientLevel } from '@/services/audio/ambientAudio';

export interface AmbientAudioController {
  /** ¿Dispone el navegador de Web Audio API? */
  supported: boolean;
  level: AmbientLevel;
  running: boolean;
  setLevel: (level: AmbientLevel) => void;
  /** Desbloquea y arranca el ambiente. Debe llamarse en un gesto del usuario. */
  start: () => Promise<void>;
  stop: () => void;
}

export function useAmbientAudio(initialLevel: AmbientLevel = 'off'): AmbientAudioController {
  const engineRef = useRef<AmbientAudioEngine | null>(null);
  const [level, setLevelState] = useState<AmbientLevel>(initialLevel);
  const [running, setRunning] = useState(false);
  const [supported] = useState(() => isAmbientAudioSupported());

  const getEngine = useCallback(() => {
    if (!engineRef.current) engineRef.current = new AmbientAudioEngine();
    return engineRef.current;
  }, []);

  const setLevel = useCallback((next: AmbientLevel) => {
    setLevelState(next);
    engineRef.current?.setLevel(next);
  }, []);

  const start = useCallback(async () => {
    if (!isAmbientAudioSupported()) return;
    const engine = getEngine();
    try {
      await engine.start();
      setRunning(true);
    } catch {
      setRunning(false);
    }
  }, [getEngine]);

  const stop = useCallback(() => {
    engineRef.current?.stop();
    setRunning(false);
  }, []);

  useEffect(() => {
    return () => {
      void engineRef.current?.dispose();
    };
  }, []);

  return { supported, level, running, setLevel, start, stop };
}