/**
 * Tipos compartidos de la capa de audio (FC-01).
 *
 * Un único contrato para todos los motores de síntesis, de modo que el
 * `AudioManager` pueda alternar entre Piper, Cloud y Web Speech sin acoplar
 * la UI a un motor concreto y sin fallos silenciosos.
 */

/** Idiomas soportados por la capa de audio. */
export type SpeechLanguage = 'en' | 'eu' | 'es';

/** Motores de síntesis disponibles en la jerarquía de fallback. */
export type AudioEngineType = 'piper' | 'cloud' | 'web-speech';

/** Estado observable del reproductor de audio. */
export type PlaybackState = 'idle' | 'loading' | 'playing' | 'error';

/** Capacidades detectadas del dispositivo/navegador. */
export interface DeviceCapabilities {
  /** WebGPU disponible (`navigator.gpu`). */
  webgpu: boolean;
  /** Web Audio API disponible (`AudioContext` o `webkitAudioContext`). */
  webAudio: boolean;
  /** Web Speech Synthesis disponible. */
  speechSynthesis: boolean;
  /** Contexto seguro (requisito para WebGPU y otras APIs). */
  secureContext: boolean;
  /** Memoria de dispositivo en GB. `null` si el navegador no la expone. */
  deviceMemoryGB: number | null;
  /** Núcleos lógicos estimados (`navigator.hardwareConcurrency`). */
  hardwareConcurrency: number;
  /** ¿Hay conexión de red? (`navigator.onLine`). */
  online: boolean;
}

/** Opciones de síntesis de un turno. */
export interface SpeakOptions {
  language?: SpeechLanguage;
  rate?: number;
  pitch?: number;
  voiceURI?: string;
}

/** Resultado de una operación de síntesis (para telemetría local y diagnóstico). */
export interface SpeakResult {
  /** Motor que finalmente reprodujo (o el seleccionado si todo falló). */
  engine: AudioEngineType;
  ok: boolean;
  /** Motores intentados en orden. */
  attempted: AudioEngineType[];
  /** Mensaje de error del último motor fallido, si lo hubo. */
  error?: string;
}

/** Contrato que debe cumplir cualquier motor de síntesis. */
export interface AudioEngineAdapter {
  readonly type: AudioEngineType;
  /** Devuelve `true` si el motor es usable con las capacidades dadas. */
  isAvailable(caps: DeviceCapabilities): Promise<boolean>;
  /** Sintetiza y reproduce. Debe lanzar `Error` si falla para permitir el fallback. */
  speak(text: string, options: SpeakOptions): Promise<void>;
  /** Cancela la reproducción en curso. */
  cancel(): void;
  /** Pre-carga en background (modelos, voces o buffers). Idempotente. */
  prewarm(): Promise<void>;
}