/**
 * Router híbrido de inferencia (FC-08): motor local (FC-07) ⇄ fallback cloud.
 *
 * Expone el MISMO contrato de streaming que `LocalLLMEngine.generate` para que el
 * gestor de roleplay (FC-03) y la interfaz no distingan la ruta:
 *
 *  - `detect()` consulta la capacidad del dispositivo (`getLLMCapability`).
 *  - `prepare()` carga el modelo local solo si `supported === true`.
 *  - `generate()` enruta al motor local; si una generación local rechaza con
 *    `WEBGPU_UNSUPPORTED | OOM | DEVICE_LOST`, redirige **transparentemente** al
 *    cliente cloud usando los mismos `callbacks`/`options`, sin cambiar la UI.
 *  - Si el dispositivo no soporta WebGPU (o no hay worker), va directo a cloud.
 */

import { getCloudLLMClient } from './cloudLLMClient';
import { getLocalLLMEngine, type GenerateCallbacks } from './localEngine';
import { getLLMCapability } from './webgpuDetection';
import type {
  LLMCapability,
  LLMChatMessage,
  LLMCompletionResult,
  LLMError,
  LLMErrorCode,
  LLMGenerateOptions,
  LLMLoadProgress,
} from './llmTypes';

/** Códigos del motor local que activan el fallback cloud (define FC-07 §6). */
const LOCAL_FALLBACK_CODES: ReadonlySet<LLMErrorCode> = new Set([
  'WEBGPU_UNSUPPORTED',
  'OOM',
  'DEVICE_LOST',
]);

/** Interfaz mínima del motor local que necesita el router. */
export interface LocalLLMClientLike {
  load: (onProgress?: (progress: LLMLoadProgress) => void) => Promise<void>;
  generate: (
    messages: LLMChatMessage[],
    callbacks?: GenerateCallbacks,
    options?: LLMGenerateOptions,
  ) => Promise<LLMCompletionResult>;
  abort: (id?: string) => void;
  dispose: () => void;
}

/** Interfaz mínima del cliente cloud que necesita el router. */
export interface CloudLLMClientLike {
  generate: (
    messages: LLMChatMessage[],
    callbacks?: GenerateCallbacks,
    options?: LLMGenerateOptions,
    scenarioKey?: string,
  ) => Promise<LLMCompletionResult>;
  abort: () => void;
}

export interface HybridLLMEngineConfig {
  /** Motor local. Por defecto el singleton `getLocalLLMEngine()`. */
  local?: LocalLLMClientLike;
  /** Cliente cloud. Por defecto el singleton `getCloudLLMClient()`. */
  cloud?: CloudLLMClientLike;
  /** Fuente de capacidades inyectable (tests). Por defecto `getLLMCapability`. */
  getCapability?: () => Promise<LLMCapability>;
}

export class HybridLLMEngine {
  private readonly local: LocalLLMClientLike;
  private readonly cloud: CloudLLMClientLike;
  private readonly getCapability: () => Promise<LLMCapability>;
  private capability: LLMCapability | null = null;
  private cloudOnly = false;

  constructor(config: HybridLLMEngineConfig = {}) {
    this.local = config.local ?? getLocalLLMEngine();
    this.cloud = config.cloud ?? getCloudLLMClient();
    this.getCapability = config.getCapability ?? getLLMCapability;
  }

  /** `true` cuando la ruta activa es cloud (decisión ya tomada o caída posterior). */
  get usingCloud(): boolean {
    return this.cloudOnly || this.capability?.supported === false;
  }

  /** Capacidad conocida del dispositivo (null antes de `detect()`/`prepare()`). */
  get knownCapability(): LLMCapability | null {
    return this.capability;
  }

  /** Detecta capacidades sin cargar nada. Devuelve la capacidad consolidada. */
  async detect(): Promise<LLMCapability> {
    this.capability = await this.getCapability();
    this.cloudOnly = !this.capability.supported;
    return this.capability;
  }

  /**
   * Prepara la ruta apropiada: carga el modelo local si el dispositivo lo soporta;
   * si la carga falla con un código de fallback local, conmuta a cloud de forma
   * transparente. Devuelve la capacidad detectada.
   */
  async prepare(
    onProgress?: (progress: LLMLoadProgress) => void,
  ): Promise<LLMCapability> {
    const cap = await this.detect();
    if (!cap.supported) return cap;

    try {
      await this.local.load(onProgress);
    } catch (caught) {
      const code = (caught as LLMError)?.code;
      if (code && LOCAL_FALLBACK_CODES.has(code)) {
        this.cloudOnly = true;
      } else {
        throw caught;
      }
    }
    return cap;
  }

  /**
   * Genera una respuesta con streaming token a token. Enruta local o cloud y, si la
   * ruta local falla con un código de fallback, redirige al cloud sin cambios en la
   * interfaz (mismos `callbacks`, mismo `options`).
   */
  async generate(
    messages: LLMChatMessage[],
    callbacks: GenerateCallbacks = {},
    options: LLMGenerateOptions = {},
    scenarioKey?: string,
  ): Promise<LLMCompletionResult> {
    if (this.capability === null) {
      await this.detect();
    }

    if (!this.cloudOnly && this.capability?.supported) {
      try {
        return await this.local.generate(messages, callbacks, options);
      } catch (caught) {
        const error = caught as LLMError;
        if (error?.code && LOCAL_FALLBACK_CODES.has(error.code)) {
          this.cloudOnly = true;
          return this.cloud.generate(messages, callbacks, options, scenarioKey);
        }
        throw caught;
      }
    }

    return this.cloud.generate(messages, callbacks, options, scenarioKey);
  }

  /** Cancela la generación en curso de ambas rutas. */
  abort(id?: string): void {
    this.local.abort(id);
    this.cloud.abort();
  }

  /** Libera el motor local (el cliente cloud no retiene recursos). */
  dispose(): void {
    this.local.dispose();
  }
}

/** Instancia única compartida del router híbrido. */
let defaultHybrid: HybridLLMEngine | null = null;

export function getHybridLLMEngine(config?: HybridLLMEngineConfig): HybridLLMEngine {
  if (!defaultHybrid) {
    defaultHybrid = new HybridLLMEngine(config);
  }
  return defaultHybrid;
}