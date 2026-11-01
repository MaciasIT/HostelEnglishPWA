/**
 * Orquestación de la síntesis Piper (FC-09).
 *
 * Convierte texto en euskera en audio nativo:
 *     resolver voz (idioma) → fonemizar (espeak-ng) → inferir (ONNX) → reproducir.
 *
 * El runtime real (onnxruntime-web + fonemizador WASM) está en `piperRuntime.ts`
 * y se inyecta por defecto, pero `createPiperSynth` acepta un runtime alternativo
 * para poder testear la orquestación sin ejecutar WASM en JSDOM.
 */

import type { SpeakOptions } from '../types';
import { resolvePiperVoice } from './piperVoices';
import type { PiperVoiceDescriptor } from './piperVoices';
import {
  ensureSession,
  phonemize,
  synthesize,
  type OrtSessionLike,
  type PiperInferenceParams,
} from './piperRuntime';
import { float32ToWav } from './wav';

/** Firma de la síntesis Piper (compatible con `PiperSynth` de `engines.ts`). */
export type PiperSynth = (text: string, options: SpeakOptions) => Promise<void>;

/** Runtime de Piper inyectable (seam para tests y futuras variantes de ejecución). */
export interface PiperRuntimeLike {
  ensureSession(voice: PiperVoiceDescriptor): Promise<unknown>;
  phonemize(text: string, espeakVoice: string): Promise<number[]>;
  synthesize(
    session: unknown,
    phonemeIds: number[],
    params: PiperInferenceParams,
  ): Promise<Float32Array>;
}

/** Runtime real (`piperRuntime.ts`) adaptado a la interfaz inyectable. */
export const defaultPiperRuntime: PiperRuntimeLike = {
  ensureSession,
  phonemize,
  synthesize: (session, ids, params) => synthesize(session as OrtSessionLike, ids, params),
};

/**
 * Crea la síntesis Piper con un runtime concreto. Devuelve la función que usa el
 * `PiperEngine`. Si Piper no atiende el idioma (p. ej. `en`/`es`), lanza para que
 * el `AudioManager` degrade limpiamente a cloud/web-speech (cero fallos silenciosos).
 *
 * `play` se inyecta para tests (no depende del DOM en JSDOM).
 */
export function createPiperSynth(
  rt: PiperRuntimeLike = defaultPiperRuntime,
  play: (samples: Float32Array, sampleRate: number, rate: number) => Promise<void> = playPcmAudio,
): PiperSynth {
  return async (text: string, options: SpeakOptions): Promise<void> => {
    const language = options.language ?? 'en';
    const voice = resolvePiperVoice(language, options.voice);
    if (!voice) {
      throw new Error(`PiperEngine: sin voz Piper nativa para '${language}'`);
    }

    const session = await rt.ensureSession(voice);
    const phonemeIds = await rt.phonemize(text, voice.espeakVoice);
    const audio = await rt.synthesize(session, phonemeIds, voice.inference);
    await play(audio, voice.sampleRate, options.rate ?? 1);
  };
}

/** Reproduce audio PCM mono (Float32) vía un `<audio>` con WAV en memoria. */
export async function playPcmAudio(
  samples: Float32Array,
  sampleRate: number,
  rate: number,
): Promise<void> {
  const wav = float32ToWav(samples, sampleRate);
  const blob = new Blob([wav], { type: 'audio/wav' });
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  audio.playbackRate = rate;
  try {
    await new Promise<void>((resolve, reject) => {
      audio.onended = () => resolve();
      audio.onerror = () => reject(new Error('Piper: error reproduciendo el audio sintetizado'));
      void audio.play().catch(reject);
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}