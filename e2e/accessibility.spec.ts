import { test, expect, type Page } from '@playwright/test';
import { baseURL, skipRoleOnboarding } from './helpers';

/** Pulsa Tab hasta `max` veces y devuelve la secuencia de nombres accesibles enfocados. */
async function tabSequence(page: Page, max: number): Promise<string[]> {
  const seen: string[] = [];
  for (let i = 0; i < max; i++) {
    await page.keyboard.press('Tab');
    const label = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el === document.body) return '';
      return (el.getAttribute('aria-label') || el.textContent || el.tagName).trim().slice(0, 60);
    });
    seen.push(label);
  }
  return seen;
}

async function open(page: Page, route: string) {
  await page.goto(baseURL);
  await skipRoleOnboarding(page);
  await page.goto(`${baseURL}#${route}`);
  await startModule(page);
}

/** Pasa la pantalla ModuleIntro ("Empezar Ahora") si está presente. */
async function startModule(page: Page) {
  const start = page.getByRole('button', { name: /empezar ahora/i });
  if (await start.isVisible({ timeout: 3000 }).catch(() => false)) await start.click();
}

test.describe('Accesibilidad · teclado', () => {
  test('Dictado: audio → input → comprobar en orden de tabulación', async ({ page }) => {
    await open(page, '/dictado');
    const player = page.getByRole('button', { name: /reproducir frase para dictado/i });
    await expect(player).toBeVisible();
    await player.focus();
    const seq = await tabSequence(page, 2);
    expect(seq[0]).toMatch(/tu respuesta al dictado/i);
    expect(seq[1]).toMatch(/comprobar respuesta/i);
    // Shift+Tab vuelve al input
    await page.keyboard.press('Shift+Tab');
    await expect(page.getByLabel(/tu respuesta al dictado/i)).toBeFocused();
  });

  test('Dictado: el resultado se anuncia en una live region', async ({ page }) => {
    await open(page, '/dictado');
    const live = page.getByTestId('dictation-live');
    await expect(live).toHaveAttribute('role', 'status');
    await expect(live).toHaveAttribute('aria-live', 'polite');
  });

  test('Flashcards: Enter y Espacio giran la tarjeta; sin trampas de foco', async ({ page }) => {
    await open(page, '/flashcards');
    const card = page.getByRole('button', { name: /tarjeta de estudio/i });
    await expect(card).toBeVisible();
    await card.focus();
    await expect(card).toHaveAccessibleName(/Original/);
    await page.keyboard.press('Space');
    await expect(card).toHaveAccessibleName(/Traducción en Español/);
    await page.keyboard.press('Enter');
    await expect(card).toHaveAccessibleName(/Original/);
    // El foco avanza (no queda atrapado en la tarjeta)
    const seq = await tabSequence(page, 6);
    expect(new Set(seq).size).toBeGreaterThan(1);
  });

  test('Examen: las opciones son alcanzables con Tab', async ({ page }) => {
    await open(page, '/examen');
    const seq = await tabSequence(page, 12);
    expect(seq.filter(Boolean).length).toBeGreaterThan(3);
  });
});

test.describe('Accesibilidad · zoom 200% / 400%', () => {
  // Zoom del navegador de N× ≡ viewport CSS dividido entre N.
  for (const zoom of [2, 4]) {
    test(`sin desbordamiento horizontal ni recortes al ${zoom * 100}%`, async ({ page }) => {
      await page.setViewportSize({ width: Math.round(1280 / zoom), height: Math.round(800 / zoom) });
      await page.goto(baseURL);
      await skipRoleOnboarding(page);
      for (const route of ['/', '/flashcards', '/dictado', '/quiz', '/examen']) {
        await page.goto(`${baseURL}#${route}`);
        await page.waitForTimeout(400);
        const m = await page.evaluate(() => ({
          client: document.documentElement.clientWidth,
          scroll: document.documentElement.scrollWidth,
        }));
        // 400% (320px) exige reflujo sin scroll horizontal (WCAG 1.4.10)
        expect(m.scroll, `${route}@${zoom * 100}%`).toBeLessThanOrEqual(m.client + 1);
      }
    });
  }

  test('tarjeta de flashcard crece con el contenido (min-h, sin altura fija)', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 200 });
    await page.goto(baseURL);
    await skipRoleOnboarding(page);
    await page.goto(`${baseURL}#/flashcards`);
    await startModule(page);
    const card = page.getByRole('button', { name: /tarjeta de estudio/i });
    await expect(card).toBeVisible();
    const h = await card.evaluate((el) => (el as HTMLElement).getBoundingClientRect().height);
    expect(h).toBeGreaterThanOrEqual(400);
  });
});
