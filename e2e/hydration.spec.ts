import { test, expect } from '@playwright/test';

const baseURL = '/HostelEnglishPWA/';

test.describe('Hydration E2E', () => {
  test('slow IndexedDB should not block App Shell and no black screen', async ({ page }) => {
    await page.goto(baseURL);

    await expect(page.locator('#root')).toBeVisible();
    await expect(page.locator('#splash')).toHaveClass(/hidden/);
    await expect(page.locator('nav[aria-label="Navegación principal"]')).toBeVisible();

    await page.goto(baseURL + '#/');
    await expect(page).toHaveURL(new RegExp(`${baseURL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}#/$`));
  });
});
