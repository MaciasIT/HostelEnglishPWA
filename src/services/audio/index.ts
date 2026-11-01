/**
 * Punto de entrada público de la capa de audio (FC-01).
 */

export { AudioManager, getAudioManager, resetAudioManagerForTest } from './AudioManager';
export type { AudioManagerOptions } from './AudioManager';

export { detectCapabilities, FALLBACK_ORDER, selectEngine } from './capabilities';
export type { CapabilitySource, EnginePreferences } from './capabilities';

export { AudioCache, fragmentKey, hashText } from './audioCache';

export { CloudEngine, PiperEngine, WebSpeechEngine } from './engines';
export type { CloudEngineOptions, CloudFetcher, PiperSynth } from './engines';

export type {
  AudioEngineAdapter,
  AudioEngineType,
  DeviceCapabilities,
  PlaybackState,
  SpeakOptions,
  SpeakResult,
  SpeechLanguage,
} from './types';