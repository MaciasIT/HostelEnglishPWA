import { test, expect } from '@playwright/test';

const baseURL = '/HostelEnglishPWA/';

const TABS = [
  { label: 'Inicio', path: '#/' },
  { label: 'Módulos', path: '#/dashboard' },
  { label: 'Frases', path: '#/frases' },
  { label: 'Quiz', path: '#/quiz' },
  { label: 'Progreso', path: '#/progreso' },
];

test.describe('Navigation E2E', () => {
  test('bottom navigation routes fluidly across main tabs', async ({ page }) => {
    await page.goto(baseURL);
    const bottomNav = page.locator('nav[aria-label="Navegación principal"]');
    await expect(bottomNav).toBeVisible();

    for (const tab of TABS) {
      await bottomNav.getByRole('link', { name: tab.label }).click();
      await expect(page).toHaveURL(new RegExp(`${baseURL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}${tab.path.replace('#', '#')}$`));
      await expect(page.locator('main')).toBeVisible();
    }

    await bottomNav.getByRole('link', { name: 'Inicio' }).click();
    await expect(page).toHaveURL(new RegExp(`${baseURL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}#/$`));
    await expect(page.locator('h1:has-text("Hostel")')).toBeVisible();
  });
});
