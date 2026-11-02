import { get, set, del, withTimeout } from '../db';

/** Tiempo máximo para leer/migrar el estado persistido antes de arrancar con el de por defecto. */
export const STORAGE_READ_TIMEOUT_MS = 2000;

/**
 * Lee, migra y valida el estado persistido. Nunca lanza ni se queda colgado:
 * ante corrupción, esquema incompatible o IndexedDB bloqueada devuelve `null`
 * (estado por defecto) y, si el dato estaba corrupto, lo elimina (reset seguro).
 */
export const readPersistedState = async (name: string): Promise<string | null> => {
  try {
    return await withTimeout(readAndMigrate(name), STORAGE_READ_TIMEOUT_MS, 'lectura/migración de estado');
  } catch (err) {
    console.warn('[store] No se pudo leer de IndexedDB, usando estado por defecto:', err);
    // Reset seguro: un dato corrupto no debe bloquear el siguiente arranque.
    // Si era legacy ya existe appState_legacy_backup. Best-effort y acotado.
    withTimeout(del(name), STORAGE_READ_TIMEOUT_MS, 'reset de estado corrupto').catch(() => {});
    return null;
  }
};

const readAndMigrate = async (name: string): Promise<string | null> => {
  const raw = await get(name);
  if (!raw) return null;

  const stored = raw as any;
  // Contrato zustand persist: { state, version }. Los datos legacy (v0)
  // se guardaron planos, sin envoltorio.
  const isEnvelope =
    stored && typeof stored === 'object' && stored.state && typeof stored.state === 'object';
  const zustandVersion: number =
    isEnvelope && typeof stored.version === 'number' ? stored.version : 0;
  let data: any = isEnvelope ? stored.state : stored;

  if (!data || typeof data !== 'object') {
    throw new Error('Estado persistido con formato inválido');
  }

  // 1. Security snapshot + migración semántica si el estado es legacy (sin version de app)
  if (!data.version) {
    const { DataMigrator } = await import('../db/DataMigrator');
    await DataMigrator.ensureBackup(data);
    console.log('🔄 Migrando datos legacy a v1...');
    data = DataMigrator.migrate(data);
  }

  // 2. Validación Zod + reparación. Zod descarta claves desconocidas
  // (isPremium, licenseInfo, retos...), así que se conservan las originales.
  const { DataValidator } = await import('../db/DataValidator');
  const validated = DataValidator.validateAndRepair(data);
  const state = { ...data, ...validated };

  return JSON.stringify({ state, version: zustandVersion });
};

export const persistStorage = () => ({
  getItem: readPersistedState,
  setItem: async (name: string, value: string) => {
    try {
      // value llega como string desde createJSONStorage; parseamos antes de guardar
      await withTimeout(set(name, JSON.parse(value)), STORAGE_READ_TIMEOUT_MS, 'escritura de estado');
    } catch (err) {
      console.warn('[store] No se pudo escribir en IndexedDB:', err);
    }
  },
  removeItem: async (name: string) => {
    try {
      await withTimeout(del(name), STORAGE_READ_TIMEOUT_MS, 'eliminación de estado');
    } catch (err) {
      console.warn('[store] No se pudo eliminar de IndexedDB:', err);
    }
  },
});
