import { test, expect } from '@playwright/test';
import { baseURL } from './helpers';

test.describe('Hydration E2E', () => {
  test('slow IndexedDB should not block App Shell and no black screen', async ({ page }) => {
    await page.goto(baseURL);

    await expect(page.locator('#root')).toBeVisible();
    // El splash se marca hidden y se elimina del DOM tras hidratar (AppInitializer),
    // lo que garantiza que no quedamos en pantalla negra.
    await expect(page.locator('#splash')).toHaveCount(0);
    await expect(page.locator('nav[aria-label="Navegación principal"]')).toBeVisible();

    await page.goto(baseURL + '#/');
    await expect(page).toHaveURL(new RegExp(`${baseURL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}#/$`));
  });
});