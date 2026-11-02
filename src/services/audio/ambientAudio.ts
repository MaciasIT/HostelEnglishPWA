/**
 * Generador acústico ambiental procedural (PM-02).
 *
 * Sintetiza en tiempo real —sin archivos de audio pesados— un ambiente de
 * sala/cafetería mediante la Web Audio API:
 *  - **Murmullo**: ruido marrón (integrador de ruido blanco) filtrado con un
 *    paso-bajo suave que simula la masa de conversaciones lejanas.
 *  - **Tintineo lejano**: ruido rosa pasa-banda (frecuencias altas) cuyo nivel
 *    se modula con un LFO lento, recreando choques de vasos y cubiertos a
 *    ráfagas irregulares.
 *
 * Ambos se mezclan en un `GainNode` maestro cuyo valor depende del nivel de
 * volumen elegido (apagado, sutil, medio, realista). El contexto se desbloquea
 * de forma segura en el primer gesto del usuario (`unlock()` + `resume()`),
 * cumpliendo las políticas de autoplay de iOS/Android.
 *
 * ## Ciclo de vida (sin fugas de `AudioNode`)
 *
 * El grafo de nodos se construye **una sola vez** y se reutiliza a lo largo de
 * ciclos `start()`/`stop()` arbitrarios: `stop()` solo enmudece (ganancia a 0)
 * sin desmontar ni recrear nodos, de modo que encender/apagar N veces no apila
 * grafos nuevos conectados a `destination` (la fuga típica de memoria). El
 * desmontaje completo —el que desconecta `/gainNode.disconnect()`/ y cierra
 * `/context.close()`/— corresponde exclusivamente a `dispose()`, que la vista
 * debe invocar al desmontar.
 *
 * La fábrica de `AudioContext` es inyectable para que los tests sean
 * deterministas sin Web Audio real (mismo patrón que `CapabilitySource`).
 */

/* ------------------------------------------------------------------------- */
/* Niveles de volumen                                                         */
/* ------------------------------------------------------------------------- */

export type AmbientLevel = 'off' | 'subtle' | 'medium' | 'realistic';

/** Ganancia lineal asignada a cada nivel (los porcentajes de la especificación). */
export const AMBIENT_LEVEL_GAIN: Record<AmbientLevel, number> = {
  off: 0,
  subtle: 0.1,
  medium: 0.25,
  realistic: 0.4,
};

/** Orden canónico de los niveles (para selectores de UI). */
export const AMBIENT_LEVEL_ORDER: readonly AmbientLevel[] = [
  'off',
  'subtle',
  'medium',
  'realistic',
];

/** Etiquetas legibles para la UI. */
export const AMBIENT_LEVEL_LABELS: Record<AmbientLevel, string> = {
  off: 'Apagado (0%)',
  subtle: 'Sutil (10%)',
  medium: 'Medio (25%)',
  realistic: 'Realista (40%)',
};

/** Tipo de ruido con el que se rellena cada buffer de bucle. */
export type NoiseKind = 'white' | 'pink' | 'brown';

/** Duración del bucle de ruido (s). Suficiente para evitar una periodicidad audible. */
export const NOISE_LOOP_SECONDS = 3;

/* ------------------------------------------------------------------------- */
/* Generación de buffers                                                      */
/* ------------------------------------------------------------------------- */

/**
 * Genera un `AudioBuffer` monofónico de `seconds` lleno de ruido del tipo
 * indicado. El ruido marrón integra ruido blanco (pendiente −6 dB/octava) y el
 * rosa usa el filtro de Paul Kellet, ambos normalizados para evitar saturación.
 */
export function generateNoiseBuffer(
  context: BaseAudioContext,
  seconds: number,
  kind: NoiseKind,
): AudioBuffer {
  const rate = context.sampleRate;
  const length = Math.max(1, Math.floor(rate * seconds));
  const buffer = context.createBuffer(1, length, rate);
  const data = buffer.getChannelData(0);

  let lastBrown = 0;
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  let b3 = 0;
  let b4 = 0;
  let b5 = 0;
  let b6 = 0;

  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1;

    if (kind === 'brown') {
      // Integrador con fuga (low-frequency bias → sensación de "masa" de sala).
      lastBrown = (lastBrown + 0.02 * white) / 1.02;
      data[i] = lastBrown * 3.5;
    } else if (kind === 'pink') {
      // Filtro de Paul Kellet (aproximación estándar de ruido rosa −3 dB/octava).
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856;
      b4 = 0.55 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
      const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      b6 = white * 0.115926;
      data[i] = pink * 0.11;
    } else {
      data[i] = white;
    }
  }

  return buffer;
}

/* ------------------------------------------------------------------------- */
/* Fábrica de contexto y detección                                            */
/* ------------------------------------------------------------------------- */

export type AudioContextFactory = () => AudioContext;

/** Fábrica por defecto: `AudioContext` estándar o `webkitAudioContext` en Safari. */
function defaultContextFactory(): AudioContext {
  if (typeof AudioContext !== 'undefined') return new AudioContext();
  const legacyWindow = window as unknown as {
    webkitAudioContext?: new () => AudioContext;
  };
  if (legacyWindow.webkitAudioContext) return new legacyWindow.webkitAudioContext();
  throw new Error('Web Audio API no disponible en este dispositivo.');
}

/** Fuente de capacidades inyectable en tests (mismo patrón que `CapabilitySource`). */
export interface AmbientCapabilitySource {
  window?: {
    AudioContext?: unknown;
    webkitAudioContext?: unknown;
  };
}

/** ¿Está disponible la Web Audio API? (detección pura, sin instanciar). */
export function isAmbientAudioSupported(
  source: AmbientCapabilitySource = globalThis as unknown as AmbientCapabilitySource,
): boolean {
  const win = source.window ?? {};
  return typeof win.AudioContext !== 'undefined' || typeof win.webkitAudioContext !== 'undefined';
}

/* ------------------------------------------------------------------------- */
/* Motor                                                                      */
/* ------------------------------------------------------------------------- */

export class AmbientAudioEngine {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sources: AudioBufferSourceNode[] = [];
  private oscillators: OscillatorNode[] = [];
  private nodes: AudioNode[] = [];
  private level: AmbientLevel = 'off';
  private running = false;
  private readonly createContext: AudioContextFactory;

  constructor(factory: AudioContextFactory = defaultContextFactory) {
    this.createContext = factory;
  }

  /** Nivel de volumen actualmente configurado. */
  getLevel(): AmbientLevel {
    return this.level;
  }

  /** Ganancia lineal efectiva del nivel configurado (0–0.4). */
  getGainValue(): number {
    return AMBIENT_LEVEL_GAIN[this.level];
  }

  /** ¿Está reproduciendo? */
  isRunning(): boolean {
    return this.running;
  }

  /** Nodo de ganancia maestro (para inspección en tests). */
  get masterGainNode(): GainNode | null {
    return this.masterGain;
  }

  /**
   * Crea (si aún no existe) y desbloquea el `AudioContext`. Debe llamarse
   * dentro de un gesto de usuario (clic/toque) para cumplir las políticas de
   * autoplay de iOS/Android. Idempotente.
   */
  async unlock(): Promise<void> {
    if (!this.context) {
      this.context = this.createContext();
    }
    if (this.context.state === 'suspended') {
      await this.context.resume();
    }
  }

  /**
   * Arranca (o reanuda) la reproducción. Construye el grafo la primera vez y
   * lo reutiliza en arranques posteriores: no hay fugas de nodos al alternar
   * encendido/apagado.
   */
  async start(): Promise<void> {
    if (this.running) return;
    await this.unlock();
    if (!this.masterGain) {
      this.buildGraph(this.context as AudioContext);
    }
    this.running = true;
    this.applyGain();
  }

  /** Para el sonido (enmudece). El grafo queda vivo y reutilizable. */
  stop(): void {
    if (!this.running) return;
    this.running = false;
    this.applyGain();
  }

  /** Cambia el nivel de volumen (aplicado al nodo de ganancia maestro). */
  setLevel(level: AmbientLevel): void {
    this.level = level;
    this.applyGain();
  }

  /**
   * Desmontaje completo: detiene fuentes y osciladores, desconecta todos los
   * nodos (`gainNode.disconnect()`) y cierra el contexto (`context.close()`)
   * para evitar fugas de memoria. Irreversible (tras `dispose` hay que
   * construir una instancia nueva). Es el paso llamado al desmontar la vista.
   */
  async dispose(): Promise<void> {
    this.stop();
    for (const src of this.sources) {
      try {
        src.stop();
      } catch {
        /* ya detenido */
      }
      src.disconnect();
    }
    this.sources = [];
    for (const osc of this.oscillators) {
      try {
        osc.stop();
      } catch {
        /* ya detenido */
      }
      osc.disconnect();
    }
    this.oscillators = [];
    if (this.masterGain) {
      this.masterGain.disconnect();
      this.masterGain = null;
    }
    for (const node of this.nodes) {
      try {
        node.disconnect();
      } catch {
        /* nodo ya desconectado */
      }
    }
    this.nodes = [];
    if (this.context) {
      await this.context.close().catch(() => {
        /* el contexto ya estaba cerrado */
      });
      this.context = null;
    }
  }

  /* --- internals ---------------------------------------------------------- */

  /** Aplica la ganancia efectiva: nivel elegido si reproduce, 0 si está detenido. */
  private applyGain(): void {
    if (!this.masterGain) return;
    this.masterGain.gain.value = this.running ? AMBIENT_LEVEL_GAIN[this.level] : 0;
  }

  private buildGraph(ctx: AudioContext): void {
    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    this.masterGain = master;
    this.nodes.push(master);

    // Capa 1 — murmullo: ruido marrón → paso-bajo → ganancia fija → master.
    const murmurGain = ctx.createGain();
    murmurGain.gain.value = 0.9;
    const murmurFilter = ctx.createBiquadFilter();
    murmurFilter.type = 'lowpass';
    murmurFilter.frequency.value = 450;
    const murmurSource = ctx.createBufferSource();
    murmurSource.buffer = generateNoiseBuffer(ctx, NOISE_LOOP_SECONDS, 'brown');
    murmurSource.loop = true;
    murmurSource.connect(murmurFilter);
    murmurFilter.connect(murmurGain);
    murmurGain.connect(master);
    murmurSource.start();
    this.sources.push(murmurSource);
    this.nodes.push(murmurFilter, murmurGain);

    // Capa 2 — tintineo: ruido rosa → pasa-banda (agudos) → modulación LFO → master.
    const clinkFilter = ctx.createBiquadFilter();
    clinkFilter.type = 'bandpass';
    clinkFilter.frequency.value = 5200;
    clinkFilter.Q.value = 8;
    const clinkLayerGain = ctx.createGain();
    clinkLayerGain.gain.value = 0.35;
    const clinkGain = ctx.createGain();
    clinkGain.gain.value = 0.5; // base; el LFO la hace oscilar 0–1

    const clinkSource = ctx.createBufferSource();
    clinkSource.buffer = generateNoiseBuffer(ctx, NOISE_LOOP_SECONDS, 'pink');
    clinkSource.loop = true;
    clinkSource.connect(clinkFilter);
    clinkFilter.connect(clinkLayerGain);
    clinkLayerGain.connect(clinkGain);
    clinkGain.connect(master);
    clinkSource.start();
    this.sources.push(clinkSource);
    this.nodes.push(clinkFilter, clinkLayerGain, clinkGain);

    // LFO lento que "abre" el tintineo a ráfagas (choques de vasos lejanos).
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.4;
    const lfoDepth = ctx.createGain();
    lfoDepth.gain.value = 0.5;
    lfo.connect(lfoDepth);
    lfoDepth.connect(clinkGain.gain);
    lfo.start();
    this.oscillators.push(lfo);
    this.nodes.push(lfoDepth);
  }
}