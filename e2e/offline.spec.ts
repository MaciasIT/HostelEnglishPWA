import { test, expect } from '@playwright/test';

const baseURL = '/HostelEnglishPWA/';

test.describe('Offline E2E', () => {
  test('initial load -> offline mode -> screens still load without error', async ({ page, context }) => {
    await page.goto(baseURL);
    await expect(page.locator('nav[aria-label="Navegación principal"]')).toBeVisible();

    await context.setOffline(true);

    const pages = ['/dashboard', '/frases', '/quiz', '/progreso'];
    for (const p of pages) {
      await page.goto(baseURL + '#' + p);
      await expect(page.locator('main')).toBeVisible();
      await expect(page.locator('nav[aria-label="Navegación principal"]')).toBeVisible();
    }

    await context.setOffline(false);
  });
});
