/**
 * Métricas locales de la ruta de inferencia cloud (FC-08).
 *
 * Registra latencia (time-to-first-token y elapsed total) y consumo de tokens de
 * cada generación en IndexedDB, de modo que se pueda auditar el uso del fallback
 * sin depender de telemetría de terceros (privacidad local-first).
 *
 * Se usa una base de datos independiente (`hostel-llm-metrics`) para no interferir
 * con `hostelenglish-v1` (estado de la app) ni `hostel-audio-cache` (audio),
 * evitando el conflicto de versión ya documentado en Fase B.
 */

import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

const DB_NAME = 'hostel-llm-metrics';
const DB_VERSION = 1;
const STORE = 'metrics';

/** Ruta de inferencia que produjo la métrica. */
export type LLMMetricRoute = 'local' | 'cloud';

/** Registro de una generación LLM (una fila por turno). */
export interface LLMMetricRecord {
  /** Clave autoincremental asignada por IndexedDB al insertar. */
  id?: number;
  /** Marca de tiempo (epoch ms) de inicio de la petición. */
  ts: number;
  /** Ruta de inferencia ('cloud' en el fallback FC-08; reservado 'local'). */
  route: LLMMetricRoute;
  /** Modelo remoto solicitado (p. ej. `@cf/meta/llama-3.2-3b-instruct`). */
  model?: string;
  /** Escenario de roleplay (clave), si la petición proviene de roleplay. */
  scenarioKey?: string;
  /** Tokens de entrada estimados del prompt. */
  promptTokens?: number;
  /** Tokens de salida emitidos (o reportados por el servidor). */
  completionTokens?: number;
  /** Latencia hasta el primer token (ms). `undefined` si nunca se emitió ninguno. */
  firstTokenMs?: number;
  /** Latencia total de la generación (ms). */
  elapsedMs: number;
  /** `true` si la generación terminó con éxito. */
  ok: boolean;
  /** Código de error (`LLMErrorCode`), solo cuando `ok === false`. */
  errorCode?: string;
}

interface MetricsSchema extends DBSchema {
  metrics: {
    key: number;
    value: LLMMetricRecord;
    indexes: { 'by-ts': number };
  };
}

/**
 * Almacén de métricas LLM en IndexedDB.
 *
 * La escritura es resiliente: cada `record` captura los errores de IndexedDB para
 * que un fallo de almacenamiento nunca rompa el flujo de generación.
 */
export class CloudMetricsStore {
  private dbPromise: Promise<IDBPDatabase<MetricsSchema>> | null = null;

  private getDb(): Promise<IDBPDatabase<MetricsSchema>> {
    if (!this.dbPromise) {
      this.dbPromise = openDB<MetricsSchema>(DB_NAME, DB_VERSION, {
        upgrade(db) {
          if (!db.objectStoreNames.contains(STORE)) {
            const store = db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
            store.createIndex('by-ts', 'ts');
          }
        },
      });
    }
    return this.dbPromise;
  }

  /** Inserta un registro y devuelve su clave autoincremental. */
  async record(metric: LLMMetricRecord): Promise<number> {
    try {
      const db = await this.getDb();
      return await db.add(STORE, metric);
    } catch {
      // No propagar errores de persistencia a la generación.
      return -1;
    }
  }

  /** Devuelve los registros más recientes (orden descendente por `ts`). */
  async recent(limit = 100): Promise<LLMMetricRecord[]> {
    try {
      const db = await this.getDb();
      const all = await db.getAll(STORE);
      return all
        .sort((a, b) => b.ts - a.ts)
        .slice(0, limit);
    } catch {
      return [];
    }
  }

  /** Vacía todas las métricas acumuladas. */
  async clear(): Promise<void> {
    try {
      const db = await this.getDb();
      await db.clear(STORE);
    } catch {
      /* noop */
    }
  }
}

/** Instancia única compartida del almacén de métricas. */
let defaultStore: CloudMetricsStore | null = null;

export function getCloudMetricsStore(): CloudMetricsStore {
  if (!defaultStore) {
    defaultStore = new CloudMetricsStore();
  }
  return defaultStore;
}