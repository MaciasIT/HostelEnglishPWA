/**
 * Fallback ASR basado en la Web Speech API.
 *
 * Se usa cuando `detectASRCapability()` indica que la ruta on-device
 * (Whisper en Web Worker) no es viable. Encapsula la API en una función
 * que devuelve `Promise<string>` para que el hook `useWhisperASR` exponga
 * una misma interfaz `transcribe()` con independencia del motor.
 */

import type { ASRLanguage } from '@/workers/whisperTypes';

/** Firma transpirable (inyectable en tests). */
export type WebSpeechTranscriber = (language: ASRLanguage) => Promise<string>;

/** Mapeo idioma → etiqueta BCP-47 consumida por SpeechRecognition. */
export const WEB_SPEECH_LANG_TAGS: Record<ASRLanguage, string> = {
  en: 'en-US',
  es: 'es-ES',
  eu: 'eu-ES',
};

/** Timeout de seguridad para no quedar colgados si el evento no llega. */
export const WEB_SPEECH_TIMEOUT_MS = 15000;

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: unknown) => void) | null;
  onerror: ((event: unknown) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

/** Constructor de SpeechRecognition si está disponible; `null` si no. */
export function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/**
 * Transcribe una intervención oral usando la Web Speech API (una sola vez,
 * `continuous: false`). Resuelve con el texto final; si no se detecta habla
 * antes del fin, resuelve con cadena vacía. Rechaza ante error o timeout.
 */
export const transcribeWithWebSpeech: WebSpeechTranscriber = (language) =>
  new Promise<string>((resolve, reject) => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      reject(new Error('Web Speech Recognition no disponible en este navegador.'));
      return;
    }

    const recognition = new Ctor();
    recognition.lang = WEB_SPEECH_LANG_TAGS[language] ?? 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        try {
          recognition.abort();
        } catch {
          /* noop */
        }
        reject(new Error('Tiempo de espera superado en la Web Speech API.'));
      }
    }, WEB_SPEECH_TIMEOUT_MS);

    const settle = (fn: () => void): void => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      fn();
    };

    recognition.onresult = (event: unknown) => {
      const e = event as {
        resultIndex?: number;
        results?: ArrayLike<{ isFinal?: boolean; 0?: { transcript?: string } }>;
      };
      let text = '';
      const results = e.results ?? [];
      for (let i = e.resultIndex ?? 0; i < results.length; i += 1) {
        const item = results[i];
        if (item?.isFinal && item[0]?.transcript) {
          text += item[0].transcript;
        }
      }
      if (text.trim()) {
        settle(() => resolve(text.trim()));
      }
    };

    recognition.onerror = (event: unknown) => {
      const e = event as { error?: string };
      settle(() => reject(new Error(`Web Speech error: ${e?.error ?? 'unknown'}`)));
    };

    recognition.onend = () => {
      settle(() => resolve(''));
    };

    try {
      recognition.start();
    } catch (err) {
      settle(() => reject(err instanceof Error ? err : new Error(String(err))));
    }
  });