import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { baseURL, skipRoleOnboarding } from './helpers';

test.describe('/equipo', () => {
  test('accesible desde SideNav, sin scroll horizontal y sin violaciones AAA', async ({ page }) => {
    await page.goto(baseURL);
    await skipRoleOnboarding(page);
    await page.getByRole('button', { name: 'Abrir menú' }).click();
    await page.getByTestId('sidenav').getByRole('link', { name: 'Equipo' }).click();
    await expect(page).toHaveURL(/#\/equipo$/);
    await expect(page.getByRole('heading', { level: 1, name: /Auditoría de plantilla/ })).toBeVisible();
    await expect(page.getByTestId('heatmap')).toBeAttached();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    const res = await new AxeBuilder({ page }).withRules(['color-contrast-enhanced', 'label', 'button-name']).analyze();
    expect(res.violations).toEqual([]);
  });

  test('modo encargado: rechaza código inválido', async ({ page }) => {
    await page.goto(`${baseURL}#/equipo`);
    await skipRoleOnboarding(page);
    await page.getByLabel(/Pega los códigos/).fill('HE1.a.b.c');
    await page.getByRole('button', { name: 'Importar códigos' }).click();
    await expect(page.getByTestId('import-status')).toContainText('inválido');
  });
});
