/**
 * Punto de entrada público del subsistema Piper (FC-09).
 */

export { createPiperSynth, defaultPiperRuntime, playPcmAudio } from './piperSynth';
export type { PiperRuntimeLike, PiperSynth } from './piperSynth';

export {
  PIPER_VOICES,
  SUPPORTED_PIPER_LANGUAGES,
  hasPiperVoice,
  piperConfigUrl,
  piperModelBaseUrl,
  piperModelUrl,
  piperVoicesFor,
  resolvePiperVoice,
} from './piperVoices';
export type { PiperVoiceDescriptor, PiperVoiceId } from './piperVoices';

export { float32ToWav } from './wav';