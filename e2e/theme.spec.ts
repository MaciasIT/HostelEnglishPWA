import { test, expect } from '@playwright/test';
import { baseURL, skipRoleOnboarding } from './helpers';

test.describe('Theme Engine E2E', () => {
  test('modo oscuro por defecto y cambio a claro aplica clase y persiste en localStorage', async ({ page }) => {
    await page.goto(baseURL);
    await skipRoleOnboarding(page);

    const themeGroup = page.getByRole('radiogroup', { name: 'Tema' });

    // Por defecto el tema es oscuro (prefs.theme === 'dark').
    await expect(themeGroup.getByRole('radio', { name: 'Modo oscuro' })).toBeChecked();
    await expect(page.locator('html')).not.toHaveClass(/light/);

    // Cambio a claro: aplica `.light` en <html>, marca el radio y persiste la preferencia.
    await themeGroup.getByRole('radio', { name: 'Modo claro' }).click();
    await expect(page.locator('html')).toHaveClass(/light/);
    await expect(themeGroup.getByRole('radio', { name: 'Modo claro' })).toBeChecked();
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem('he-theme')))
      .toBe('light');
  });

  test('vuelve a oscuro y el modo automático se marca correctamente', async ({ page }) => {
    await page.goto(baseURL);
    await skipRoleOnboarding(page);

    const themeGroup = page.getByRole('radiogroup', { name: 'Tema' });

    await themeGroup.getByRole('radio', { name: 'Modo claro' }).click();
    await expect(page.locator('html')).toHaveClass(/light/);

    await themeGroup.getByRole('radio', { name: 'Modo oscuro' }).click();
    await expect(page.locator('html')).not.toHaveClass(/light/);

    await themeGroup.getByRole('radio', { name: 'Modo automático' }).click();
    await expect(themeGroup.getByRole('radio', { name: 'Modo automático' })).toBeChecked();
    // `auto` resuelve a dark o light según prefers-color-scheme; ambas son válidas.
    await expect(page.locator('html').evaluate((el) => el.className)).resolves.toMatch(/^(light|)$/);
  });
});