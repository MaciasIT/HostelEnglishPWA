/**
 * rush-hour-stress.spec.ts — Stress E2E (PM-07): hidratación con estado masivo
 * y línea base del Modo "Rush Hour".
 *
 * Nota (actualizada): el sintetizador de ambiente (PM-02) y el flujo Rush Hour
 * están siéndose implementados en paralelo; el stress acústico fino (fugas de
 * nodos) vive en `src/services/audio/ambientAudioStress.test.ts`. Este spec
 * cubre la resiliencia de arranque/hidratación:
 *   1) Línea base de arranque sin pantalla negra,
 *   2) Inyección de un estado persistido agresivo (1.500 reviewItems FSRS + 3
 *      blobs de voz de 200KB en IndexedDB) verificando que la app no congela
 *      el hilo principal al hidratar.
 */

import { test, expect } from '@playwright/test';
import { baseURL, skipRoleOnboarding } from './helpers';

const DB_NAME = 'hostelenglish-v1';
const DB_VERSION = 3;
const STORE_NAME = 'appState';
const PERSIST_KEY = 'hostelenglish-storage';

/** Estado persistido en la forma que espera zustand persist (envelope). */
function heavyState() {
  const reviewItems: Record<string, unknown> = {};
  for (let i = 0; i < 1500; i++) {
    reviewItems[`phrase-${i}`] = {
      id: `phrase-${i}`,
      dueDate: new Date(Date.now() - i * 3600_000).toISOString(),
      difficulty: 5,
      stability: 0.1,
      retrievability: 0,
      lapses: 0,
      reps: 0,
      state: 'new',
    };
  }

  // 3 blobs de voz de ~200KB (base64 determinista; solo pesa, no se decodifica).
  const audioBlob = 'ABCDEF0123456789'.repeat(12800); // ~200KB

  return {
    state: {
      version: 1,
      reviewItems,
      progress: {},
      prefs: {
        targetLanguage: 'en',
        theme: 'light',
        audioSpeed: 1,
        conversationSettings: {},
        phraseSettings: { voiceURI: '', rate: 1, pitch: 1 },
        preferredRole: 'bar',
        studentName: '',
      },
      dailyActivity: {},
      examHistory: [],
      achievements: [],
      certifications: [],
      voicePortfolio: [audioBlob, audioBlob, audioBlob],
    },
    version: 0,
  };
}

/** Escribe el estado pesado directamente en IndexedDB (mismo store que la app). */
async function seedIndexedDB(page: import('@playwright/test').Page): Promise<void> {
  await page.evaluate(
    ({ dbName, dbVersion, storeName, persistKey, seed }) =>
      new Promise<void>((resolve, reject) => {
        const req = indexedDB.open(dbName, dbVersion);
        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName);
          }
        };
        req.onsuccess = () => {
          const db = req.result;
          const tx = db.transaction(storeName, 'readwrite');
          tx.objectStore(storeName).put(seed, persistKey);
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
          tx.onerror = () => reject(tx.error);
        };
        req.onerror = () => reject(req.error);
      }),
    {
      dbName: DB_NAME,
      dbVersion: DB_VERSION,
      storeName: STORE_NAME,
      persistKey: PERSIST_KEY,
      seed: heavyState(),
    },
  );
}

test('línea base: la app arranca e hidrata sin pantalla negra', async ({ page }) => {
  await page.goto(baseURL);
  await skipRoleOnboarding(page);

  // Tras hidratar, el shell principal debe ser visible e interactivo.
  const nav = page.getByRole('navigation');
  await expect(nav.first()).toBeVisible();
});

test('hidratación resiliente con 1.500 reviewItems FSRS + 3 blobs de voz', async ({
  page,
}) => {
  await page.goto(baseURL);

  // Sembramos el estado pesado ANTES de que la app hidrate (cargamos, sellamos
  // IDB, recargamos). La app lo leerá en su arranque.
  await seedIndexedDB(page);

  // Recargamos para forzar la hidratación desde el estado sembrado.
  await page.reload();

  // La app debe recuperarse y mostrar la UI (sin pantalla negra ni cuelgue).
  await skipRoleOnboarding(page);
  await expect(page.getByRole('navigation').first()).toBeVisible({ timeout: 20_000 });

  // El hilo principal responde: el shell presenta sus enlaces de sección
  // (la app hidrató y renderizó la navegación completa sin congelarse).
  await expect(page.getByRole('navigation').first().getByRole('link').first()).toBeVisible();
});