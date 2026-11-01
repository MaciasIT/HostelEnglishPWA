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

// Piper (FC-09): voces euskaldunas y síntesis on-device (onnxruntime-web + espeak-ng).
export {
  createPiperSynth,
  defaultPiperRuntime,
  playPcmAudio,
  PIPER_VOICES,
  SUPPORTED_PIPER_LANGUAGES,
  hasPiperVoice,
  piperConfigUrl,
  piperModelBaseUrl,
  piperModelUrl,
  piperVoicesFor,
  resolvePiperVoice,
  float32ToWav,
} from './piper';
export type { PiperRuntimeLike, PiperVoiceDescriptor, PiperVoiceId } from './piper';

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

// Scoring fonético (FC-05): fonemizador ligero + DTW + catálogo de errores.
export { scorePronunciation } from './phoneticScorer';
export type {
  PronunciationIssue,
  PhoneticScores,
  PhoneticScoreResult,
  ScorePronunciationOptions,
} from './phoneticScorer';
export { phonemize } from './phonemizer';
export type { ScoringLanguage } from './phonemizer';
export { alignPhonemes } from './dtw';
export type { DTWResult, AlignmentStep } from './dtw';
export { HISPANOPHONE_CONFUSIONS, substitutionCost, findConfusion } from './pronunciationCatalog';
export type { ConfusionRule, ErrorCategory } from './pronunciationCatalog';