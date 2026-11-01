/**
 * AudioManager — singleton centralizado de la capa de audio (FC-01).
 *
 * Detecta las capacidades del cliente, selecciona el mejor motor de síntesis
 * (Piper on-device > Cloud streaming > Web Speech) y reproduce con degradación
 * escalonada para garantizar cero fallos silenciosos: si un motor falla, el
 * siguiente toma el relevo sin interrumpir la lección.
 */

import { detectCapabilities, FALLBACK_ORDER, selectEngine, type EnginePreferences } from './capabilities';
import { AudioCache } from './audioCache';
import { CloudEngine, PiperEngine, WebSpeechEngine } from './engines';
import { resolvePiperVoice } from './piper';
import type {
  AudioEngineAdapter,
  AudioEngineType,
  DeviceCapabilities,
  PlaybackState,
  SpeakOptions,
  SpeakResult,
} from './types';

/** Endpoint opcional de streaming cloud (configurado vía variables de entorno). */
const CLOUD_TTS_ENDPOINT =
  (import.meta.env.VITE_TTS_STREAM_URL as string | undefined) ?? undefined;

export interface AudioManagerOptions {
  capabilities?: DeviceCapabilities;
  engines?: AudioEngineAdapter[];
  preferences?: EnginePreferences;
  cache?: AudioCache;
}

export class AudioManager {
  private readonly capabilities: DeviceCapabilities;
  private readonly engines: AudioEngineAdapter[];
  private readonly preferences: EnginePreferences;
  private readonly cache: AudioCache;

  private state: PlaybackState = 'idle';
  private listeners = new Set<(state: PlaybackState) => void>();
  private preloadPromise: Promise<void> | null = null;
  private generation = 0;

  constructor(options: AudioManagerOptions = {}) {
    this.capabilities = options.capabilities ?? detectCapabilities();
    this.preferences = options.preferences ?? buildDefaultPreferences();
    this.cache = options.cache ?? new AudioCache();
    this.engines = options.engines ?? buildDefaultEngines(this.cache);
  }

  getCapabilities(): DeviceCapabilities {
    return this.capabilities;
  }

  getCache(): AudioCache {
    return this.cache;
  }

  /** Motor seleccionado por capacidades (y preferencias) en el momento actual. */
  getSelectedEngine(): AudioEngineType {
    return selectEngine(this.capabilities, this.preferences);
  }

  getState(): PlaybackState {
    return this.state;
  }

  /** Se suscribe a cambios de estado; devuelve la función de desuscripción. */
  subscribe(listener: (state: PlaybackState) => void): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  /**
   * Sintetiza y reproduce con degradación escalonada. Nunca falla en silencio:
   * si Piper o la red fallan, conmuta al siguiente motor disponible.
   */
  async speak(text: string, options: SpeakOptions = {}): Promise<SpeakResult> {
    const normalized = text.trim();
    if (!normalized) {
      return {
        engine: this.getSelectedEngine(),
        ok: false,
        attempted: [],
        error: 'texto vacío',
      };
    }

    this.cancelEngines();
    const gen = ++this.generation;
    const resolvedOptions = this.resolveVoice(options);
    this.setState('loading');

    const attempted: AudioEngineType[] = [];
    let lastError: string | undefined;

    for (const engine of this.orderedEngines()) {
      if (gen !== this.generation) break;

      let available = false;
      try {
        available = await engine.isAvailable(this.capabilities, resolvedOptions.language);
      } catch {
        available = false;
      }
      if (!available) continue;

      attempted.push(engine.type);
      try {
        this.setState('playing');
        await engine.speak(normalized, resolvedOptions);
        if (gen !== this.generation) break;
        this.setState('idle');
        return { engine: engine.type, ok: true, attempted };
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
      }
    }

    // Ningún motor pudo reproducir: el error debe ser visible, no silencioso.
    if (gen === this.generation) this.setState('error');
    return {
      engine: this.getSelectedEngine(),
      ok: false,
      attempted,
      error: lastError ?? 'ningún motor de síntesis disponible',
    };
  }

  /** Cancela cualquier síntesis en curso y vuelve a `idle`. */
  cancel(): void {
    this.generation++;
    this.cancelEngines();
    this.setState('idle');
  }

  /** Pre-carga en background: voces del motor seleccionado + desbloqueo de AudioContext. */
  async preload(): Promise<void> {
    if (this.preloadPromise) return this.preloadPromise;
    this.preloadPromise = (async () => {
      const selected = this.getSelectedEngine();
      const engine = this.engines.find((e) => e.type === selected);
      if (engine) await engine.prewarm();
      this.primeAudioContext();
    })().finally(() => {
      this.preloadPromise = null;
    });
    return this.preloadPromise;
  }

  /** Orden de intento: desde el motor seleccionado hacia el fallback nativo. */
  private orderedEngines(): AudioEngineAdapter[] {
    const selected = this.getSelectedEngine();
    const types = FALLBACK_ORDER.slice(FALLBACK_ORDER.indexOf(selected));
    return types
      .map((t) => this.engines.find((e) => e.type === t))
      .filter((e): e is AudioEngineAdapter => Boolean(e));
  }

  /**
   * Conmutación automática de voz por idioma (FC-09).
   *
   * Cuando se reproduce euskera sin voz explícita, inyecta la voz Piper
   * euskaldun por defecto (`eu_ES-antton-medium`) para que el `PiperEngine`
   * la utilice; el resto de idiomas no reciben voz Piper y siguen su ruta
   * cloud/web-speech.
   */
  private resolveVoice(options: SpeakOptions): SpeakOptions {
    if (options.voice) return options;
    const language = options.language ?? 'en';
    const voice = resolvePiperVoice(language);
    if (!voice) return options;
    return { ...options, voice: voice.id };
  }

  private cancelEngines(): void {
    for (const engine of this.engines) {
      try {
        engine.cancel();
      } catch {
        // Ignorar: la cancelación es best-effort.
      }
    }
  }

  private primeAudioContext(): void {
    // iOS/Safari requieren (en algunos flujos) reanudar el AudioContext tras un
    // gesto de usuario. Lo creamos y liberamos para validar que está disponible.
    const Ctor =
      typeof window !== 'undefined'
        ? (window.AudioContext ??
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)
        : undefined;
    if (!Ctor) return;
    try {
      const ctx = new Ctor();
      if (ctx.state === 'suspended') void ctx.resume().catch(() => undefined);
      void ctx.close().catch(() => undefined);
    } catch {
      // Sin AudioContext utilizable: no es bloqueante.
    }
  }

  private setState(next: PlaybackState): void {
    if (this.state === next) return;
    this.state = next;
    for (const listener of this.listeners) listener(next);
  }
}

function buildDefaultPreferences(): EnginePreferences {
  return { cloudEnabled: Boolean(CLOUD_TTS_ENDPOINT), forcedEngine: null };
}

function buildDefaultEngines(cache: AudioCache): AudioEngineAdapter[] {
  return [new PiperEngine(), new CloudEngine({ endpoint: CLOUD_TTS_ENDPOINT, cache }), new WebSpeechEngine()];
}

let singleton: AudioManager | null = null;

/** Devuelve la instancia única del gestor de audio. */
export function getAudioManager(): AudioManager {
  if (!singleton) singleton = new AudioManager();
  return singleton;
}

/** Reinicia el singleton (solo para tests). */
export function resetAudioManagerForTest(): void {
  singleton = null;
}