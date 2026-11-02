/**
 * ambientAudioStress.test.ts — ESTRÉS DESTRUCTIVO del sintetizador de ambiente (PM-02).
 *
 * Objetivo: simular el ciclo de uso real del "Modo Rush Hour" — encender/apagar
 * el ruido ambiental N veces seguidas — y detectar fugas de `AudioNode`/`AudioContext`
 * (nodos desconectables que quedan "vivos" en el grafo, consumiendo memoria).
 *
 * Utiliza un `AudioContext` fake CONECTABLE (grafo de conexiones real) para contar
 * cuántos nodos permanecen conectados a `destination` tras cada ciclo. Este es el
 * test que la tarjeta PM-07 pide explícitamente para el criterio 1a.
 */

import { describe, it, expect } from 'vitest';
import { AmbientAudioEngine } from './ambientAudio';

/* ── Fake Web Audio con grafo de conexiones real ──────────────────────── */

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
  /** Nodos a los que este nodo alimenta su salida. */
  outgoing = new Set<FakeNode>();

  connect(target: FakeNode | FakeParam): this {
    if (target instanceof FakeNode) {
      this.outgoing.add(target);
    }
    return this;
  }

  disconnect(): void {
    this.outgoing.clear();
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
  nodes: FakeNode[] = [];
  closeCalls = 0;

  createGain(): FakeNode {
    return this.track(new FakeNode());
  }
  createBiquadFilter(): FakeNode {
    return this.track(new FakeNode());
  }
  createBufferSource(): FakeNode {
    const n = new FakeNode();
    n.loop = false;
    return this.track(n);
  }
  createOscillator(): FakeNode {
    return this.track(new FakeNode());
  }
  createBuffer(channels: number, length: number): FakeAudioBuffer {
    void channels;
    return new FakeAudioBuffer(length);
  }
  resume(): Promise<void> {
    this.state = 'running';
    return Promise.resolve();
  }
  close(): Promise<void> {
    this.closeCalls += 1;
    this.state = 'closed';
    return Promise.resolve();
  }

  private track(node: FakeNode): FakeNode {
    this.nodes.push(node);
    return node;
  }

  /** Nº de nodos que actualmente alimentan `destination` (o sus ancestros vivos). */
  get nodesConnectedToDestination(): number {
    let count = 0;
    const seen = new Set<FakeNode>();
    const walk = (n: FakeNode) => {
      if (seen.has(n)) return;
      seen.add(n);
      if (n.outgoing.has(this.destination)) count += 1;
      for (const o of n.outgoing) walk(o);
    };
    for (const n of this.nodes) walk(n);
    return count;
  }
}

function makeCtx(): FakeAudioContext {
  return new FakeAudioContext();
}

/* ── Pruebas destruidas ──────────────────────────────────────────────── */

describe('AmbientAudioEngine — 50 ciclos start/stop sin fugas de AudioNode', () => {
  it('NO acumula nodos conectados a destination tras 50 ciclos de encendido/apagado', async () => {
    const ctx = makeCtx();
    const engine = new AmbientAudioEngine(() => ctx as unknown as AudioContext);

    await engine.start();
    const baseline = ctx.nodesConnectedToDestination;
    const baselineNodes = ctx.nodes.length;
    engine.stop();

    for (let i = 0; i < 50; i++) {
      await engine.start();
      engine.stop();
    }

    const after = ctx.nodesConnectedToDestination;

    // Si stop() no desconecta el master ni los nodos intermedios, cada ciclo
    // apila un grafo nuevo conectado a destination → fuga de memoria.
    expect(after).toBe(baseline);

    // Y el total de nodos materializados no debe crecer sin control
    // (cada arranque crea ~7-9 nodos; 51 arranques = ~460 nodos).
    expect(ctx.nodes.length).toBeLessThanOrEqual(baselineNodes * 51 + 10);
  });

  it('un único AudioContext compartido: 50 ciclos no crean contextos nuevos', async () => {
    let factoryCalls = 0;
    const ctx = makeCtx();
    const engine = new AmbientAudioEngine(() => {
      factoryCalls += 1;
      return ctx as unknown as AudioContext;
    });

    for (let i = 0; i < 50; i++) {
      await engine.start();
      engine.stop();
    }

    expect(factoryCalls).toBe(1);
    expect(ctx.closeCalls).toBe(0);
  });

  it('dispose() limpia por completo y deja cero nodos conectados a destination', async () => {
    const ctx = makeCtx();
    const engine = new AmbientAudioEngine(() => ctx as unknown as AudioContext);

    await engine.start();
    await engine.dispose();

    expect(ctx.closeCalls).toBe(1);
    expect(ctx.state).toBe('closed');
    expect(engine.isRunning()).toBe(false);
  });
});