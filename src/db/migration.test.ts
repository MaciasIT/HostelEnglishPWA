import { describe, it, expect, beforeEach, vi } from 'vitest';
import 'fake-indexeddb/auto';
import { DataMigrator } from './DataMigrator';
import { DataValidator } from './DataValidator';
import * as db from './index';

describe('Data Migration & Validation (TDD)', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // Limpiar IndexedDB antes de cada test si fuera necesario
    const databases = await indexedDB.databases();
    for (const database of databases) {
      if (database.name) indexedDB.deleteDatabase(database.name);
    }
  });

  const legacyData = {
    progress: {
      101: 2, // ID numérico (Legacy)
      '102': 3
    },
    prefs: {
      targetLanguage: 'en',
      theme: 'dark'
      // Faltan campos como audioSpeed, conversationSettings...
    },
    dailyActivity: { '2023-10-01': 5 }
  };

  it('debería convertir IDs numéricos a strings y añadir version: 1', () => {
    const migrated = DataMigrator.migrate(legacyData);
    
    expect(migrated.version).toBe(1);
    expect(migrated.progress['101']).toBe(2);
    expect(typeof Object.keys(migrated.progress)[0]).toBe('string');
  });

  it('debería completar campos faltantes con valores por defecto (Soft Reset)', () => {
    const migrated = DataMigrator.migrate(legacyData);
    const validated = DataValidator.validateAndRepair(migrated);
    
    expect(validated.prefs.audioSpeed).toBe(1);
    expect(validated.prefs.phraseSettings).toBeDefined();
    expect(validated.progress['101']).toBe(2); // Mantiene lo bueno
  });

  it('debería crear un backup solo si no existe appState_legacy_backup', async () => {
    // Mock de db.get y db.set
    const dbGetSpy = vi.spyOn(db, 'get');
    const dbSetSpy = vi.spyOn(db, 'set');

    // Escenario 1: No hay backup
    dbGetSpy.mockResolvedValueOnce(undefined); // Para el check de backup existente
    
    await DataMigrator.ensureBackup(legacyData);
    
    expect(dbSetSpy).toHaveBeenCalledWith('appState_legacy_backup', legacyData);
    
    // Escenario 2: Ya hay un backup
    dbSetSpy.mockClear();
    dbGetSpy.mockResolvedValueOnce({ saved: 'data' });
    
    await DataMigrator.ensureBackup(legacyData);
    
    expect(dbSetSpy).not.toHaveBeenCalledWith('appState_legacy_backup', expect.anything());
  });

  it('debería fallar el parseo si la estructura está totalmente rota pero permitir recuperación', () => {
    const corruptedData = { version: 1, progress: "No soy un record" };
    
    const result = DataValidator.validateAndRepair(corruptedData);
    
    // Debería devolver un estado inicial limpio o reparado si falla catastróficamente
    expect(result.version).toBe(1);
    expect(typeof result.progress).toBe('object');
  });
});
