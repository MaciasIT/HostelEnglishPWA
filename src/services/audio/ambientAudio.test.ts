import { describe, it, expect, vi } from 'vitest';

import {
  AmbientAudioEngine,
  AMBIENT_LEVEL_GAIN,
  AMBIENT_LEVEL_ORDER,
  generateNoiseBuffer,
  isAmbientAudioSupported,
  NOISE_LOOP_SECONDS,
} from './ambientAudio';
import type { AmbientLevel, NoiseKind } from './ambientAudio';

/* ------------------------------------------------------------------------- */
/* Fake mínimo de Web Audio para tests (jsdom no expone AudioContext).        */
/* ------------------------------------------------------------------------- */

class FakeParam {
  value = 0;
}

class FakeNode {
  type = '';
  gain = new FakeParam();
  frequency = new FakeParam();
  Q = new FakeParam();
  offset = new FakeParam();
  buffer: unknown = null;
  loop = false;
  started = false;
  stopped = false;
  connectCalls = 0;
  disconnectCalls = 0;

  connect(): this {
    this.connectCalls += 1;
    return this;
  }

  disconnect(): void {
    this.disconnectCalls += 1;
  }

  start(): void {
    this.started = true;
  }

  stop(): void {
    this.stopped = true;
  }
}

class FakeAudioBuffer {
  private data: Float32Array;
  constructor(length: number) {
    this.data = new Float32Array(length);
  }
  getChannelData(): Float32Array {
    return this.data;
  }
}

class FakeAudioContext {
  state: AudioContextState = 'running';
  sampleRate = 44100;
  destination = new FakeNode();
  created: FakeNode[] = [];
  resumeCalls = 0;
  closeCalls = 0;

  createGain(): FakeNode {
    return this.track(new FakeNode());
  }
  createBiquadFilter(): FakeNode {
    return this.track(new FakeNode());
  }
  createBufferSource(): FakeNode {
    return this.track(new FakeNode());
  }
  createOscillator(): FakeNode {
    return this.track(new FakeNode());
  }
  createBuffer(channels: number, length: number): FakeAudioBuffer {
    void channels;
    return new FakeAudioBuffer(length);
  }
  resume(): Promise<void> {
    this.resumeCalls += 1;
    this.state = 'running';
    return Promise.resolve();
  }
  close(): Promise<void> {
    this.closeCalls += 1;
    this.state = 'closed';
    return Promise.resolve();
  }

  private track(node: FakeNode): FakeNode {
    this.created.push(node);
    return node;
  }
}

function fakeContextFactory(): FakeAudioContext & { state: AudioContextState } {
  return new FakeAudioContext();
}

/** Enumera los nodos fuente realmente creados por el motor. */
function sourcesOf(ctx: FakeAudioContext): FakeNode[] {
  // El motor usa createBufferSource dos veces (murmullo + tintineo).
  return ctx.created.filter((n) => n.buffer !== null && n.loop === true);
}

/* ------------------------------------------------------------------------- */
/* isAmbientAudioSupported                                                    */
/* ------------------------------------------------------------------------- */

describe('isAmbientAudioSupported', () => {
  it('detecta Web Audio por AudioContext o webkitAudioContext', () => {
    expect(isAmbientAudioSupported({ window: { AudioContext: {} } })).toBe(true);
    expect(isAmbientAudioSupported({ window: { webkitAudioContext: {} } })).toBe(true);
    expect(isAmbientAudioSupported({ window: {} })).toBe(false);
  });
});

/* ------------------------------------------------------------------------- */
/* generateNoiseBuffer                                                        */
/* ------------------------------------------------------------------------- */

describe('generateNoiseBuffer', () => {
  it('genera un buffer monofónico del largo pedido con muestras acotadas', () => {
    const ctx = new FakeAudioContext();
    for (const kind of ['white', 'pink', 'brown'] as NoiseKind[]) {
      const b = generateNoiseBuffer(ctx as unknown as BaseAudioContext, 0.1, kind);
      const data = b.getChannelData(0);
      expect(data.length).toBe(Math.floor(ctx.sampleRate * 0.1));
      // Todas las muestras deben ser finitas y de amplitud razonable.
      for (let i = 0; i < data.length; i++) {
        expect(Number.isFinite(data[i])).toBe(true);
        expect(Math.abs(data[i])).toBeLessThanOrEqual(4);
      }
    }
  });

  it('el ruido marrón no satura y el rosa difiere del blanco', () => {
    const ctx = new FakeAudioContext();
    const white = generateNoiseBuffer(ctx as unknown as BaseAudioContext, 0.05, 'white').getChannelData(0);
    const pink = generateNoiseBuffer(ctx as unknown as BaseAudioContext, 0.05, 'pink').getChannelData(0);
    expect(Array.from(pink).some((v, i) => v !== white[i])).toBe(true);
  });
});

/* ------------------------------------------------------------------------- */
/* AMBIENT_LEVEL_GAIN (contrato de niveles)                                   */
/* ------------------------------------------------------------------------- */

describe('AMBIENT_LEVEL_GAIN', () => {
  it('expone los cuatro niveles con las ganancias especificadas', () => {
    expect(AMBIENT_LEVEL_ORDER).toEqual(['off', 'subtle', 'medium', 'realistic']);
    expect(AMBIENT_LEVEL_GAIN.off).toBe(0);
    expect(AMBIENT_LEVEL_GAIN.subtle).toBe(0.1);
    expect(AMBIENT_LEVEL_GAIN.medium).toBe(0.25);
    expect(AMBIENT_LEVEL_GAIN.realistic).toBe(0.4);
  });
});

/* ------------------------------------------------------------------------- */
/* AmbientAudioEngine                                                         */
/* ------------------------------------------------------------------------- */

describe('AmbientAudioEngine', () => {
  it('crea el contexto de forma perezosa solo al desbloquear', async () => {
    const factory = vi.fn(fakeContextFactory);
    const engine = new AmbientAudioEngine(factory as unknown as () => AudioContext);

    expect(factory).not.toHaveBeenCalled();
    expect(engine.isRunning()).toBe(false);

    await engine.unlock();
    expect(factory).toHaveBeenCalledTimes(1);
    expect(engine.getLevel()).toBe('off');
  });

  it('arranca: crea sources, resuelve el master gain y marca running', async () => {
    const ctx = new FakeAudioContext();
    const engine = new AmbientAudioEngine(() => ctx as unknown as AudioContext);

    await engine.start();

    expect(engine.isRunning()).toBe(true);
    expect(engine.masterGainNode).not.toBeNull();
    expect(sourcesOf(ctx).length).toBe(2);
    expect(sourcesOf(ctx).every((s) => s.started)).toBe(true);
    expect(NOISE_LOOP_SECONDS).toBeGreaterThan(0);
  });

  it('reanuda un contexto suspendido en vez de recrearlo', async () => {
    const ctx = new FakeAudioContext();
    ctx.state = 'suspended';
    const engine = new AmbientAudioEngine(() => ctx as unknown as AudioContext);

    await engine.unlock();
    expect(ctx.resumeCalls).toBe(1);
    expect(ctx.state).toBe('running');

    await engine.unlock();
    expect(ctx.resumeCalls).toBe(1); // idempotente: ya en running
  });

  it('cambia la ganancia del master al llamar a setLevel', async () => {
    const ctx = new FakeAudioContext();
    const engine = new AmbientAudioEngine(() => ctx as unknown as AudioContext);
    await engine.start();

    const levels: AmbientLevel[] = ['subtle', 'medium', 'realistic', 'off'];
    for (const level of levels) {
      engine.setLevel(level);
      expect(engine.getLevel()).toBe(level);
      expect(engine.masterGainNode?.gain.value).toBe(AMBIENT_LEVEL_GAIN[level]);
    }
  });

  it('aplica el nivel configurado al arrancar sin sobrescribirlo', async () => {
    const ctx = new FakeAudioContext();
    const engine = new AmbientAudioEngine(() => ctx as unknown as AudioContext);
    engine.setLevel('medium');

    await engine.start();
    expect(engine.masterGainNode?.gain.value).toBe(AMBIENT_LEVEL_GAIN.medium);
  });

  it('stop enmudece (ganancia 0) sin desmontar el grafo y permite rearrancar', async () => {
    const ctx = new FakeAudioContext();
    const engine = new AmbientAudioEngine(() => ctx as unknown as AudioContext);
    engine.setLevel('medium');
    await engine.start();
    expect(engine.masterGainNode?.gain.value).toBe(AMBIENT_LEVEL_GAIN.medium);

    const graphNodesBefore = ctx.created.length;
    engine.stop();

    expect(engine.isRunning()).toBe(false);
    expect(engine.masterGainNode?.gain.value).toBe(0);

    // Un segundo start reanuda y reutiliza el grafo: no crea nodos nuevos.
    await engine.start();
    expect(engine.isRunning()).toBe(true);
    expect(engine.masterGainNode?.gain.value).toBe(AMBIENT_LEVEL_GAIN.medium);
    expect(ctx.created.length).toBe(graphNodesBefore);
  });

  it('dispose desconecta el master, los nodos y cierra el contexto', async () => {
    const ctx = new FakeAudioContext();
    const engine = new AmbientAudioEngine(() => ctx as unknown as AudioContext);
    await engine.start();

    const master = engine.masterGainNode as unknown as FakeNode;
    await engine.dispose();

    expect(master.disconnectCalls).toBeGreaterThanOrEqual(1);
    expect(ctx.closeCalls).toBe(1);
    expect(ctx.state).toBe('closed');
    expect(engine.isRunning()).toBe(false);
    expect(engine.masterGainNode).toBeNull();
  });

  it('start sin unlock previo desbloquea automáticamente', async () => {
    const ctx = new FakeAudioContext();
    ctx.state = 'suspended';
    const engine = new AmbientAudioEngine(() => ctx as unknown as AudioContext);

    await engine.start();
    expect(ctx.state).toBe('running');
    expect(engine.isRunning()).toBe(true);
  });
});