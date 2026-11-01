/**
 * Registro de voces Piper para la síntesis on-device (FC-09).
 *
 * Piper sintetiza de forma NATIVA el euskera (voces Antton y Maider del
 * `rhasspy/piper-voices`), reemplazando el antiguo apaño fonético
 * `euToEsPhonetic` y la dependencia de Google Translate TTS.
 *
 * Cada descriptor codifica la información necesaria para (1) descargar/cargar
 * el modelo ONNX, (2) fonemizar con espeak-ng (`espeakVoice`) y (3) ejecutar la
 * inferencia con los parámetros correctos (del `.onnx.json` del modelo).
 *
 * Este módulo es *puro* (sin imports pesados) a propósito: lo importan el
 * `AudioManager`, el `PiperEngine` y el runtime de Piper sin arrastrar
 * `onnxruntime-web` al hilo principal en timepo de carga.
 */

import type { SpeechLanguage } from '../types';

/** Identificadores de las voces Piper empaquetadas. */
export type PiperVoiceId = 'eu_ES-antton-medium' | 'eu_ES-maider-medium';

/** Descriptor de una voz Piper. */
export interface PiperVoiceDescriptor {
  id: PiperVoiceId;
  /** Idioma de la app al que da servicio esta voz. */
  language: SpeechLanguage;
  /** Género de la voz (para la UI de selección). */
  gender: 'male' | 'female';
  /** Nombre corto legible. */
  name: string;
  /** Voz espeak-ng usada por el fonemizador (coincide con `espeak.voice` del config). */
  espeakVoice: string;
  /** Frecuencia de muestreo del audio de salida (del config `audio.sample_rate`). */
  sampleRate: number;
  /** Parámetros de inferencia por defecto (del config `inference`). */
  inference: { noiseScale: number; lengthScale: number; noiseW: number };
  /** Ruta relativa del artefacto `.onnx` dentro del base URL de modelos. */
  modelFile: string;
  /** Ruta relativa del artefacto `.onnx.json` dentro del base URL de modelos. */
  configFile: string;
}

/** Base URL canónico de los modelos (repo público `rhasspy/piper-voices`). */
const HF_PIPER_BASE = 'https://huggingface.co/rhasspy/piper-voices/resolve/main';

/** Voces euskaldunas empaquetadas (medium = equilibrio calidad/tamaño). */
export const PIPER_VOICES: Record<PiperVoiceId, PiperVoiceDescriptor> = {
  'eu_ES-antton-medium': {
    id: 'eu_ES-antton-medium',
    language: 'eu',
    gender: 'male',
    name: 'Antton',
    espeakVoice: 'eu',
    sampleRate: 22050,
    inference: { noiseScale: 0.667, lengthScale: 1.0, noiseW: 0.8 },
    modelFile: 'eu/eu_ES/antton/medium/eu_ES-antton-medium.onnx',
    configFile: 'eu/eu_ES/antton/medium/eu_ES-antton-medium.onnx.json',
  },
  'eu_ES-maider-medium': {
    id: 'eu_ES-maider-medium',
    language: 'eu',
    gender: 'female',
    name: 'Maider',
    espeakVoice: 'eu',
    sampleRate: 22050,
    inference: { noiseScale: 0.667, lengthScale: 1.0, noiseW: 0.8 },
    modelFile: 'eu/eu_ES/maider/medium/eu_ES-maider-medium.onnx',
    configFile: 'eu/eu_ES/maider/medium/eu_ES-maider-medium.onnx.json',
  },
};

/** Idiomas de la app que Piper puede sintetizar nativamente (por ahora, euskera). */
export const SUPPORTED_PIPER_LANGUAGES: readonly SpeechLanguage[] = ['eu'];

/** Voz por defecto por idioma soportado. */
const DEFAULT_VOICE_BY_LANGUAGE: Partial<Record<SpeechLanguage, PiperVoiceId>> = {
  eu: 'eu_ES-antton-medium',
};

/** Alias cortos de voz (para configuración legible). */
const VOICE_ALIASES: Record<string, PiperVoiceId> = {
  antton: 'eu_ES-antton-medium',
  maider: 'eu_ES-maider-medium',
};

/** Base URL de los artefactos del modelo (sobreescribible para self-hosting). */
export function piperModelBaseUrl(): string {
  return (import.meta.env.VITE_PIPER_MODEL_BASE_URL as string | undefined) ?? HF_PIPER_BASE;
}

/** URL completa del modelo ONNX de una voz. */
export function piperModelUrl(voice: PiperVoiceDescriptor): string {
  return `${piperModelBaseUrl()}/${voice.modelFile}`;
}

/** URL completa del config JSON de una voz. */
export function piperConfigUrl(voice: PiperVoiceDescriptor): string {
  return `${piperModelBaseUrl()}/${voice.configFile}`;
}

/** ¿Piper da servicio nativo a este idioma? */
export function hasPiperVoice(language: SpeechLanguage): boolean {
  return SUPPORTED_PIPER_LANGUAGES.includes(language);
}

/**
 * Resuelve la voz Piper para un idioma, con opción de preferir una voz concreta
 * (id completo o alias corto). Devuelve `undefined` cuando Piper no da servicio
 * al idioma solicitado (por ejemplo `en` o `es`).
 */
export function resolvePiperVoice(
  language: SpeechLanguage,
  preferred?: string,
): PiperVoiceDescriptor | undefined {
  if (!hasPiperVoice(language)) return undefined;

  let id: PiperVoiceId | undefined;
  if (preferred) {
    const asId = PIPER_VOICES[preferred as PiperVoiceId];
    if (asId && asId.language === language) {
      id = asId.id;
    } else {
      const alias = VOICE_ALIASES[preferred.toLowerCase()];
      if (alias) id = alias;
    }
  }

  const fallback = DEFAULT_VOICE_BY_LANGUAGE[language] ?? 'eu_ES-antton-medium';
  return PIPER_VOICES[id ?? fallback];
}

/** Voces Piper disponibles para un idioma (para la UI de selección). */
export function piperVoicesFor(language: SpeechLanguage): PiperVoiceDescriptor[] {
  return Object.values(PIPER_VOICES).filter((v) => v.language === language);
}