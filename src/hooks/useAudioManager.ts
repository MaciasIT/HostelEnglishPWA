/**
 * Hook React que conecta el `AudioManager` singleton con los componentes.
 *
 * Expone `speak`/`cancel`/`preload`, el estado de reproducción (`status`) y un
 * `waveformState` ya mapeado para el componente `<AudioWaveform />`.
 */

import { useCallback, useSyncExternalStore } from 'react';

import { AudioManager, getAudioManager } from '@/services/audio/AudioManager';
import type {
  AudioEngineType,
  PlaybackState,
  SpeakOptions,
  SpeakResult,
} from '@/services/audio/types';
import type { WaveformState } from '@/components/AudioWaveform';

/** Mapea el estado de reproducción al estado visual del waveform. */
export function mapPlaybackToWaveform(state: PlaybackState): WaveformState {
  switch (state) {
    case 'playing':
      return 'playing';
    case 'loading':
      return 'processing';
    case 'error':
      return 'error';
    default:
      return 'idle';
  }
}

export interface UseAudioManagerResult {
  speak: (text: string, options?: SpeakOptions) => Promise<SpeakResult>;
  cancel: () => void;
  preload: () => Promise<void>;
  status: PlaybackState;
  waveformState: WaveformState;
  engine: AudioEngineType;
}

export function useAudioManager(manager: AudioManager = getAudioManager()): UseAudioManagerResult {
  const status = useSyncExternalStore(
    useCallback((onChange: () => void) => manager.subscribe(() => onChange()), [manager]),
    () => manager.getState(),
    () => manager.getState(),
  );

  const speak = useCallback(
    (text: string, options?: SpeakOptions) => manager.speak(text, options),
    [manager],
  );
  const cancel = useCallback(() => manager.cancel(), [manager]);
  const preload = useCallback(() => manager.preload(), [manager]);

  return {
    speak,
    cancel,
    preload,
    status,
    waveformState: mapPlaybackToWaveform(status),
    engine: manager.getSelectedEngine(),
  };
}