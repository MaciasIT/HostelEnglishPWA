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

// ASR (FC-02): detección de capacidades y fallback Web Speech.
export { detectASRCapability } from './asrCapabilities';
export type { ASRCapability, ASRCapabilitySource } from './asrCapabilities';

export { getSpeechRecognitionCtor, transcribeWithWebSpeech } from './webSpeechASR';
export type { WebSpeechTranscriber } from './webSpeechASR';

export type {
  AudioEngineAdapter,
  AudioEngineType,
  DeviceCapabilities,
  PlaybackState,
  SpeakOptions,
  SpeakResult,
  SpeechLanguage,
} from './types';