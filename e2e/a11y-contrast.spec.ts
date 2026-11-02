import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { baseURL, skipRoleOnboarding } from './helpers';

const ROUTES = ['', '#/dashboard', '#/frases', '#/conversaciones', '#/quiz', '#/flashcards', '#/progreso', '#/configuracion'];

for (const mode of ['dark', 'light'] as const) {
  test.describe(`axe color-contrast AAA (${mode})`, () => {
    test(`rutas principales sin violaciones color-contrast-enhanced`, async ({ page }) => {
      await page.goto(baseURL);
      await skipRoleOnboarding(page);
      if (mode === 'light') {
        await page.getByRole('button', { name: 'Cambiar a modo claro' }).click();
        await expect(page.locator('html')).toHaveClass(/light/);
      }

      for (const route of ROUTES) {
        await page.goto(baseURL + route);
        await page.waitForLoadState('networkidle');
        const results = await new AxeBuilder({ page })
          .withRules(['color-contrast-enhanced'])
          .analyze();
        const summary = results.violations.flatMap((v) =>
          v.nodes.map((n) => `${route || '/'} ${n.target.join(' ')} → ${n.any[0]?.message ?? ''}`),
        );
        expect(summary, `Violaciones AAA en ${route || '/'} (${mode})`).toEqual([]);
      }
    });
  });
}

test('foco por teclado: anillo de 2px visible en botones, enlaces e inputs', async ({ page }) => {
  await page.goto(baseURL + '#/frases');
  await skipRoleOnboarding(page);
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press('Tab');
    const style = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement;
      const cs = getComputedStyle(el);
      return { tag: el.tagName, width: cs.outlineWidth, style: cs.outlineStyle };
    });
    expect(style.style, `${style.tag} sin outline`).not.toBe('none');
    expect(parseFloat(style.width), `${style.tag} outline < 2px`).toBeGreaterThanOrEqual(2);
  }
});
