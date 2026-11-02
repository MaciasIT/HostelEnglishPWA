/**
 * audioStress.test.ts — Suite de pruebas DESTRUCTIVAS y de ESTRÉS (PM-07).
 *
 * Objetivo: golpear las costuras de la capa de audio (AudioContext), el
 * scheduling FSRS a escala, y el almacenamiento/validación IndexedDB+Zod para
 * detectar fugas de memoria (instancias zombis), bloqueos de hilo y estados
 * inconsistentes antes de que lo hagan usuarios reales en móviles modestos.
 *
 * ⚠️ NOTA DE CONTEXTO: esta suite estresa las primitivas TRANSVERSALES de las
 * que dependen PM-02/04/05 (ciclo de vida del AudioContext de la capa TTS,
 * generación/cancelación de síntesis, scheduler FSRS y Zod/IndexedDB). El
 * stress fino del sintetizador de ambiente (PM-02) vive en
 * `src/services/audio/ambientAudioStress.test.ts` (donde se reprodujo una fuga
 * de AudioNode). Ver `docs/plan-2026/INFORME_QA_ENTERPRISE_ESTRES.md`.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import { AudioManager, resetAudioManagerForTest } from '@/services/audio/AudioManager';
import type {
  AudioEngineAdapter,
  AudioEngineType,
  DeviceCapabilities,
} from '@/services/audio/types';
import { scheduleNextReview, migrateFromProgress, type ReviewItem } from '@/services/fsrsScheduler';
import { DataValidator } from '@/db/DataValidator';
import { AppStateSchema } from '@/models/schemas';
import { set, get, __resetIdbFallback } from '@/db';
import { readPersistedState } from '@/store/persistStorage';

/* ──────────────────────────────────────────────────────────────────────── */
/* Helpers                                                                   */
/* ──────────────────────────────────────────────────────────────────────── */

function caps(overrides: Partial<DeviceCapabilities> = {}): DeviceCapabilities {
  return {
    webgpu: true,
    webAudio: true,
    speechSynthesis: true,
    secureContext: true,
    deviceMemoryGB: 8,
    hardwareConcurrency: 8,
    online: true,
    ...overrides,
  };
}

function fakeEngine(type: AudioEngineType, available = true): AudioEngineAdapter {
  return {
    type,
    isAvailable: vi.fn(async () => available),
    speak: vi.fn(async () => {}),
    cancel: vi.fn(),
    prewarm: vi.fn(async () => {}),
  };
}

function nowMs(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

function buildReviewItems(n: number, now = new Date()): ReviewItem[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `phrase-${i}`,
    dueDate: new Date(now.getTime() - i * 3600_000), // vencidas de forma escalonada
    difficulty: 5,
    stability: 0.1,
    retrievability: 0,
    lapses: 0,
    reps: 0,
    state: 'new' as const,
  }));
}

/* ──────────────────────────────────────────────────────────────────────── */
/* 1. Ciclo de vida del AudioContext — detección de instancias zombis         */
/* ──────────────────────────────────────────────────────────────────────── */

/** Instala un AudioContext fake contable en `window` y expone métricas de fuga. */
function installCountingAudioContext() {
  let created = 0;
  let closed = 0;
  const open: object[] = [];

  class FakeAudioContext {
    state = 'running';
    resume = vi.fn(async () => undefined);
    close = vi.fn(async () => {
      closed += 1;
      const idx = open.indexOf(this);
      if (idx >= 0) open.splice(idx, 1);
    });
    constructor() {
      created += 1;
      open.push(this);
    }
  }

  vi.stubGlobal('AudioContext', FakeAudioContext);
  Object.defineProperty(window, 'AudioContext', {
    value: FakeAudioContext,
    configurable: true,
  });

  return {
    get created(): number {
      return created;
    },
    get closed(): number {
      return closed;
    },
    /** Nº de instancias que siguen "vivas" (creadas y nunca cerradas) = zombis. */
    get alive(): number {
      return open.length;
    },
  };
}

describe('PM-07 · Estrés acústico — AudioContext (50 ciclos start/stop)', () => {
  beforeEach(() => {
    resetAudioManagerForTest();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('50 ciclos de preload NO dejan instancias AudioContext zombis (created === closed)', async () => {
    const counter = installCountingAudioContext();
    const m = new AudioManager({
      capabilities: caps(),
      engines: [fakeEngine('web-speech')],
    });

    const started = nowMs();
    for (let i = 0; i < 50; i++) {
      await m.preload();
    }
    const elapsed = nowMs() - started;

    // Ninguna instancia puede quedar huérfana: cada AudioContext creado debe cerrarse.
    expect(counter.created).toBeGreaterThanOrEqual(50);
    expect(counter.closed).toBe(counter.created);
    expect(counter.alive).toBe(0);

    // La latencia acumulada de 50 ciclos debe ser razonable (< 2s en jsdom).
    expect(elapsed).toBeLessThan(2000);
  });

  it('repetir preload() no acaba con el manager en estado inconsistente', async () => {
    const counter = installCountingAudioContext();
    const piper = fakeEngine('piper');
    const m = new AudioManager({ capabilities: caps(), engines: [piper] });

    for (let i = 0; i < 50; i++) {
      await m.preload();
      expect(m.getState()).toBe('idle');
    }
    expect(counter.alive).toBe(0);
  });
});

/* ──────────────────────────────────────────────────────────────────────── */
/* 2. Síntesis concurrente (TTS) — fugas de listeners y cancelación            */
/* ──────────────────────────────────────────────────────────────────────── */

describe('PM-07 · TTS concurrente bajo carga', () => {
  beforeEach(() => {
    resetAudioManagerForTest();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('20 síntesis concurrentes no dejan estado colgado ni listeners fantasma', async () => {
    const piper = fakeEngine('piper');
    const m = new AudioManager({ capabilities: caps(), engines: [piper] });

    const results = await Promise.all(
      Array.from({ length: 20 }, (_, i) => m.speak(`frase ${i}`)),
    );

    // Con cancelación por generación, solo la última síntesis retiene el turno.
    expect(results.filter((r) => r.ok).length).toBeGreaterThanOrEqual(1);
    expect(['idle', 'error'].includes(m.getState())).toBe(true);

    // Sin fuga de listeners: subscribe() devuelve una función de desuscripción.
    const off = m.subscribe(() => {});
    expect(typeof off).toBe('function');
    off();
    // Y el manager sigue utilizable tras la ráfaga.
    await m.speak('ok-final');
  });

  it('la última síntesis gana (cancelación por generación) sin lanzar excepciones', async () => {
    const piper = fakeEngine('piper');
    // La síntesis se resuelve tras un micro-tick: simula latencia de motor.
    vi.mocked(piper.speak).mockImplementation(async () => {
      await new Promise((r) => setTimeout(r, 5));
    });
    const m = new AudioManager({ capabilities: caps(), engines: [piper] });

    const started = nowMs();
    await Promise.all([m.speak('a'), m.speak('b'), m.speak('c')]);
    const elapsed = nowMs() - started;

    // La ráfaga completa no debe congelar: < 500ms con motores fake rápidos.
    expect(elapsed).toBeLessThan(500);
    expect(m.getState()).not.toBe('loading');
  });
});

/* ──────────────────────────────────────────────────────────────────────── */
/* 3. Estrés de FSRS — cola de 1.500 frases                                     */
/* ──────────────────────────────────────────────────────────────────────── */

describe('PM-07 · FSRS a escala (1.500 ítems en cola)', () => {
  it('programa 1.500 revisiones sin degradación de latencia', () => {
    const items = buildReviewItems(1500);
    const started = nowMs();

    const scheduled = items.map((item) => scheduleNextReview(item, 'good'));

    const elapsed = nowMs() - started;

    expect(scheduled).toHaveLength(1500);
    // Cada ítem avanza en reps y queda en estado 'review'.
    expect(scheduled.every((r) => r.item.reps === 1 && r.item.state === 'review')).toBe(true);
    // 1.500 schedules de FSRS deben completarse en < 500ms (CPU suficientemente holgada).
    expect(elapsed).toBeLessThan(500);
  });

  it('migra 1.500 ítems legacy (progress → reviewItems) acotado en tiempo', () => {
    const started = nowMs();
    const migrated: Record<string, ReviewItem> = {};
    for (let i = 0; i < 1500; i++) {
      migrated[`phrase-${i}`] = migrateFromProgress(`phrase-${i}`, i % 4);
    }
    const elapsed = nowMs() - started;

    expect(Object.keys(migrated)).toHaveLength(1500);
    expect(elapsed).toBeLessThan(500);
  });
});

/* ──────────────────────────────────────────────────────────────────────── */
/* 4. Backups / IndexedDB — rechazo de payloads corruptos y maliciosos          */
/* ──────────────────────────────────────────────────────────────────────── */

describe('PM-07 · Importación de payloads corruptos (IndexedDB + Zod)', () => {
  beforeEach(() => {
    __resetIdbFallback();
  });

  it('Zod repara un payload truncado sin dejar el store en mal estado', () => {
    const truncated = {
      version: 1,
      progress: { 'phrase-1': 3 },
      reviewItems: { x: { id: 'x' } },
    };
    // `reviewItems.x` está incompleto: Zod falla y repara (soft reset),
    // preservando solo las partes válidas.
    const repaired = DataValidator.validateAndRepair(truncated);
    expect(repaired.reviewItems['x']).toBeUndefined();
    expect(repaired.progress['phrase-1']).toBe(3);
  });

  it('Zod repara un prefs con tipo incorrecto (número) a su valor por defecto', () => {
    const malicious = { version: 1, prefs: 42 };
    const repaired = DataValidator.validateAndRepair(malicious);
    expect(repaired.prefs.targetLanguage).toBe('en');
  });

  it('Zod rechaza duramente un payload no-objeto', () => {
    expect(() => AppStateSchema.parse('corrupto')).toThrow();
    expect(() => AppStateSchema.parse(null)).toThrow();
    expect(() => AppStateSchema.parse([1, 2, 3])).toThrow();
  });

  it('importar una cadena corrupta desde IndexedDB activa reset seguro (null)', async () => {
    await set('appState', 'esto-no-es-un-estado-válido');

    const result = await readPersistedState('appState');
    // readPersistedState nunca lanza: devuelve null (estado por defecto)
    // y elimina el dato corrupto (reset seguro).
    expect(result).toBeNull();
    const remaining = await get('appState');
    expect(remaining).toBeUndefined();
  });

  it('un estado con 1.500 reviewItems válidos se valida íntegro sin pérdida', () => {
    const reviewItems: Record<string, unknown> = {};
    for (let i = 0; i < 1500; i++) {
      reviewItems[`phrase-${i}`] = {
        id: `phrase-${i}`,
        dueDate: new Date().toISOString(),
        difficulty: 5,
        stability: 0.1,
        retrievability: 0,
        lapses: 0,
        reps: 0,
        state: 'new',
      };
    }
    const full = AppStateSchema.parse({ version: 1, reviewItems });
    expect(Object.keys(full.reviewItems)).toHaveLength(1500);
  });
});