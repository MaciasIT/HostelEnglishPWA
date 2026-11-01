/**
 * Motores de síntesis de la capa de audio (FC-01).
 *
 * Cada motor implementa `AudioEngineAdapter`. Los motores que aún no están
 * integrados (Piper ONNX, Cloud streaming) fallan de forma explícita — lanzan
 * `Error` — para que el `AudioManager` degrade limpiamente al siguiente motor
 * en vez de producir un fallo silencioso.
 */

import { playAudio } from '@/utils/audio';

import { createPiperSynth, hasPiperVoice } from './piper';
import { fragmentKey, type AudioCache, type AudioFragment } from './audioCache';
import type {
  AudioEngineAdapter,
  DeviceCapabilities,
  SpeakOptions,
  SpeechLanguage,
} from './types';

/**
 * WebSpeechEngine — fallback nativo (último recurso).
 * Delega en el util TTS híbrido existente para no romper el comportamiento actual.
 */
export class WebSpeechEngine implements AudioEngineAdapter {
  readonly type = 'web-speech' as const;

  async isAvailable(caps: DeviceCapabilities): Promise<boolean> {
    return caps.speechSynthesis;
  }

  async speak(text: string, options: SpeakOptions): Promise<void> {
    await playAudio(text, options.language ?? 'en', {
      rate: options.rate ?? 1,
      pitch: options.pitch ?? 1,
      voiceURI: options.voiceURI,
    });
  }

  cancel(): void {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }

  async prewarm(): Promise<void> {
    if (typeof window === 'undefined' || !window.speechSynthesis?.getVoices) return;
    // Algunos navegadores cargan las voces de forma perezosa: forzar la carga
    // en background evita latencia en el primer turno.
    if (window.speechSynthesis.getVoices().length > 0) return;
    await new Promise<void>((resolve) => {
      const onVoices = () => resolve();
      window.speechSynthesis?.addEventListener?.('voiceschanged', onVoices);
      // Timeout de seguridad para no quedar colgado si el evento no llega.
      setTimeout(() => {
        window.speechSynthesis?.removeEventListener?.('voiceschanged', onVoices);
        resolve();
      }, 3000);
    });
  }
}

/** Función de síntesis inyectable para Piper (permite mockear en tests). */
export type PiperSynth = (text: string, options: SpeakOptions) => Promise<void>;

/**
 * PiperEngine — síntesis on-device NATIVA (FC-09).
 *
 * Integra la síntesis real de Piper (onnxruntime-web + fonemizador espeak-ng,
 * ver `./piper`). Da servicio solo a los idiomas con voz Piper empaquetada
 * (por ahora, euskera: voces Antton y Maider); para el resto (`en`/`es`) se
 * declara no disponible y el `AudioManager` degrada limpiamente a
 * cloud/web-speech (cero fallos silenciosos).
 */
export class PiperEngine implements AudioEngineAdapter {
  readonly type = 'piper' as const;

  constructor(private synth: PiperSynth = createPiperSynth()) {}

  async isAvailable(caps: DeviceCapabilities, language?: SpeechLanguage): Promise<boolean> {
    if (!caps.webgpu || !caps.webAudio) return false;
    // Sin idioma no podemos descartar por voz; el idioma concreto se valida en
    // `speak` (que delega en la degradación limpia si no hay voz Piper).
    return language === undefined || hasPiperVoice(language);
  }

  async speak(text: string, options: SpeakOptions): Promise<void> {
    const language = options.language ?? 'en';
    if (!hasPiperVoice(language)) {
      throw new Error(`PiperEngine: sin voz Piper nativa para '${language}'`);
    }
    await this.synth(text, options);
  }

  cancel(): void {
    // Piper no gestiona colas propias; la cancelación la coordina el AudioManager.
  }

  async prewarm(): Promise<void> {
    // La descarga de voces ONNX es perezosa y ocurre en la primera síntesis.
  }
}

/** Firma del fetch HTTP inyectable para Cloud (permite mockear en tests). */
export type CloudFetcher = (input: string, init?: RequestInit) => Promise<Response>;

export interface CloudEngineOptions {
  endpoint?: string;
  cache?: AudioCache;
  fetchFn?: CloudFetcher;
}

/**
 * CloudEngine — síntesis por streaming (Cloudflare Workers AI / API híbrida).
 * Cache-first: fragmentos frecuentes se reproducen sin red tras la primera vez.
 */
export class CloudEngine implements AudioEngineAdapter {
  readonly type = 'cloud' as const;

  private readonly endpoint: string | undefined;
  private readonly fetchFn: CloudFetcher;
  private readonly cache: AudioCache | undefined;
  private currentAudio: HTMLAudioElement | null = null;

  constructor(options: CloudEngineOptions = {}) {
    this.endpoint = options.endpoint;
    this.cache = options.cache;
    this.fetchFn = options.fetchFn ?? ((input, init) => fetch(input, init));
  }

  async isAvailable(caps: DeviceCapabilities): Promise<boolean> {
    return caps.online && Boolean(this.endpoint);
  }

  async speak(text: string, options: SpeakOptions): Promise<void> {
    if (!this.endpoint) {
      throw new Error('CloudEngine: endpoint de streaming no configurado');
    }

    const language: SpeechLanguage = options.language ?? 'en';
    const key = fragmentKey(text, language, 'cloud');

    if (this.cache) {
      const cached = await this.cache.get(key);
      if (cached) {
        const cachedBlob = new Blob([cached.buffer], { type: cached.mimeType });
        await this.playBlob(cachedBlob, options.rate ?? 1);
        return;
      }
    }

    const res = await this.fetchFn(this.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, language }),
    });

    if (!res.ok) {
      throw new Error(`CloudEngine: respuesta ${res.status}`);
    }

    const blob = await res.blob();
    if (this.cache) {
      const fragment: AudioFragment = {
        buffer: await blob.arrayBuffer(),
        mimeType: blob.type,
      };
      await this.cache.put(key, fragment);
    }
    await this.playBlob(blob, options.rate ?? 1);
  }

  cancel(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.src = '';
      this.currentAudio = null;
    }
  }

  async prewarm(): Promise<void> {
    // Nada que precargar en la ruta cloud (sin cold start local).
  }

  private async playBlob(blob: Blob, rate: number): Promise<void> {
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.playbackRate = rate;
    this.currentAudio = audio;
    try {
      await new Promise<void>((resolve, reject) => {
        audio.onended = () => resolve();
        audio.onerror = () => reject(new Error('CloudEngine: error de reproducción de audio'));
        void audio.play().catch(reject);
      });
    } finally {
      if (this.currentAudio === audio) this.currentAudio = null;
      URL.revokeObjectURL(url);
    }
  }
}