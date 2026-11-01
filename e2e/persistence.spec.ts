import { test, expect } from '@playwright/test';
import { baseURL, skipRoleOnboarding } from './helpers';

test.describe('Persistencia de estado tras recarga', () => {
  test('rol y tema sobreviven a F5', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (m) => {
      if (m.text().includes("couldn't be migrated")) errors.push(m.text());
    });

    await page.goto(baseURL);
    await skipRoleOnboarding(page);

    const themeGroup = page.getByRole('radiogroup', { name: 'Tema' });
    await themeGroup.getByRole('radio', { name: 'Modo claro' }).click();
    await expect(page.locator('html')).toHaveClass(/light/);

    // Espera a que zustand escriba en IndexedDB (appState).
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            new Promise<string | null>((resolve) => {
              const req = indexedDB.open('hostelenglish-v1');
              req.onerror = () => resolve(null);
              req.onsuccess = () => {
                const db = req.result;
                if (!db.objectStoreNames.contains('appState')) return resolve(null);
                const g = db.transaction('appState').objectStore('appState').get('hostelenglish-storage');
                g.onsuccess = () => resolve(g.result?.state?.prefs?.theme ?? null);
                g.onerror = () => resolve(null);
              };
            }),
        ),
      )
      .toBe('light');

    await page.reload();

    await expect(page.locator('html')).toHaveClass(/light/);
    await expect(page.getByRole('dialog', { name: /puesto de trabajo/i })).toHaveCount(0);
    await expect(
      page.getByRole('radiogroup', { name: 'Tema' }).getByRole('radio', { name: 'Modo claro' }),
    ).toBeChecked();
    expect(errors).toEqual([]);
  });
});
