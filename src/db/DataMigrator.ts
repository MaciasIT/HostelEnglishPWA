import { get, set } from './index';

export class DataMigrator {
  /**
   * Transforms legacy data to V1 format.
   * - Normalizes progress keys to strings.
   * - Injects version: 1.
   */
  static migrate(data: any): any {
    if (!data) return data;

    // Normalización de progreso (IDs de número a string)
    const normalizedProgress: Record<string, number> = {};
    if (data.progress) {
      Object.entries(data.progress).forEach(([key, value]) => {
        normalizedProgress[String(key)] = value as number;
      });
    }

    return {
      ...data,
      progress: normalizedProgress,
      version: 1,
    };
  }

  /**
   * Creates a backup in a separate key only if it doesn't already exist.
   */
  static async ensureBackup(data: any): Promise<void> {
    if (!data) return;
    
    const existingBackup = await get('appState_legacy_backup');
    if (!existingBackup) {
      console.log('📦 Creando backup de seguridad (Snapshot Legacy)...');
      await set('appState_legacy_backup', data);
    } else {
      console.log('ℹ️ Backup existente detectado. Omitiendo sobrescritura.');
    }
  }
}
