import { test, expect } from '@playwright/test';
import { baseURL, skipRoleOnboarding } from './helpers';

test.describe('Theme Engine E2E', () => {
  test('modo oscuro por defecto y cambio a claro aplica clase y persiste en localStorage', async ({ page }) => {
    await page.goto(baseURL);
    await skipRoleOnboarding(page);

    const mobileThemeButton = page.getByRole('button', { name: 'Cambiar a modo claro' });
    await expect(mobileThemeButton).toBeVisible();
    await expect(page.locator('html')).not.toHaveClass(/light/);

    // En móvil el selector reducido alterna entre claro y oscuro.
    await mobileThemeButton.click();
    await expect(page.locator('html')).toHaveClass(/light/);
    await expect(page.getByRole('button', { name: 'Cambiar a modo oscuro' })).toBeVisible();
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem('he-theme')))
      .toBe('light');
  });

  test('vuelve a oscuro y el modo automático se marca correctamente', async ({ page }) => {
    await page.goto(baseURL);
    await skipRoleOnboarding(page);

    await page.setViewportSize({ width: 768, height: 800 });
    const themeGroup = page.getByRole('radiogroup', { name: 'Tema' });
    await expect(themeGroup.getByRole('radio', { name: 'Modo oscuro' })).toBeChecked();

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