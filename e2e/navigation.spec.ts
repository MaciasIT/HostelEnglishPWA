import { test, expect } from '@playwright/test';
import { baseURL, skipRoleOnboarding } from './helpers';

const BOTTOM_TABS = [
  { label: 'Inicio', path: '#/' },
  { label: 'Módulos', path: '#/dashboard' },
  { label: 'Frases', path: '#/frases' },
  { label: 'Quiz', path: '#/quiz' },
  { label: 'Progreso', path: '#/progreso' },
];

test.describe('Navigation E2E (móvil)', () => {
  test('bottom navigation enruta de forma fluida entre las pestañas principales', async ({ page }) => {
    await page.goto(baseURL);
    await skipRoleOnboarding(page);

    const bottomNav = page.locator('nav[aria-label="Navegación principal"]');
    await expect(bottomNav).toBeVisible();

    for (const tab of BOTTOM_TABS) {
      await bottomNav.getByRole('link', { name: tab.label }).click();
      await expect(page).toHaveURL(new RegExp(`${baseURL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}${tab.path}$`));
      await expect(page.locator('main')).toBeVisible();
    }

    await bottomNav.getByRole('link', { name: 'Inicio' }).click();
    await expect(page).toHaveURL(new RegExp(`${baseURL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}#/$`));
    await expect(page.locator('main h1:has-text("HostelEnglish")')).toBeVisible();
  });

  test('el menú lateral (SideNav) se abre desde TopNav y navega a una sección', async ({ page }) => {
    await page.goto(baseURL);
    await skipRoleOnboarding(page);

    // SideNav en móvil es un drawer fuera de pantalla marcado como inert;
    // se abre con el botón hamburguesa de TopNav.
    const sideNav = page.getByTestId('sidenav');
    await expect(sideNav).toHaveAttribute('inert', '');

    await page.getByRole('button', { name: 'Abrir menú' }).click();
    await expect(sideNav).not.toHaveAttribute('inert', '');
    await expect(page.getByTestId('sidenav-backdrop')).toBeVisible();

    await sideNav.getByRole('link', { name: 'Flashcards' }).click();
    await expect(page).toHaveURL(new RegExp(`${baseURL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}#/flashcards$`));
    await expect(page.locator('main')).toBeVisible();
  });
});

test.describe('Navigation E2E (escritorio)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('sidebar persistente enruta a una sección sin ocultarse', async ({ page }) => {
    await page.goto(baseURL);
    await skipRoleOnboarding(page);

    const sideNav = page.getByTestId('sidenav');
    await expect(sideNav).toBeVisible();
    await expect(sideNav).not.toHaveAttribute('inert', '');

    await sideNav.getByRole('link', { name: 'Examen' }).click();
    await expect(page).toHaveURL(new RegExp(`${baseURL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}#/examen$`));
    await expect(page.locator('main')).toBeVisible();
    await expect(sideNav).toBeVisible();
  });
});