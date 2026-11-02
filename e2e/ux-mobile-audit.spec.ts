import { test, expect, type Page } from '@playwright/test';
import { baseURL, skipRoleOnboarding } from './helpers';

const VIEWPORTS = [
  { name: 'Galaxy A55 · 360×800', width: 360, height: 800 },
  { name: 'iPhone SE · 375×667', width: 375, height: 667 },
  { name: 'iPhone 16 · 393×852', width: 393, height: 852 },
];

const MOBILE_ROUTES = [
  '/',
  '/dashboard',
  '/frases',
  '/conversaciones',
  '/roleplay',
  '/quiz',
  '/dictado',
  '/flashcards',
  '/progreso',
  '/examen',
  '/configuracion',
];

async function assertNoHorizontalOverflow(page: Page, route: string) {
  const dimensions = await page.evaluate(() => ({
    viewport: window.innerWidth,
    client: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  expect(dimensions.client, `${route}: viewport/client mismatch`).toBe(dimensions.viewport);
  expect(dimensions.scroll, `${route}: document has horizontal overflow`).toBe(dimensions.client);
}

async function assertTouchTarget(page: Page, role: 'button' | 'link', name: string | RegExp) {
  const box = await page.getByRole(role, { name }).boundingBox();
  expect(box, `${name} should be visible`).not.toBeNull();
  expect(box!.width, `${name} width`).toBeGreaterThanOrEqual(44);
  expect(box!.height, `${name} height`).toBeGreaterThanOrEqual(44);
}

for (const viewport of VIEWPORTS) {
  test.describe(`Auditoría móvil ${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test('rutas principales sin overflow, navegación alcanzable y select estilizados', async ({ page }) => {
      await page.goto(baseURL);
      await skipRoleOnboarding(page);

      await assertTouchTarget(page, 'button', 'Abrir menú');
      await assertTouchTarget(page, 'button', 'Cambiar a modo claro');
      await assertTouchTarget(page, 'link', 'Perfil y ajustes');

      const bottomNav = page.getByRole('navigation', { name: 'Navegación principal' });
      await expect(bottomNav).toBeVisible();
      for (const label of ['Inicio', 'Módulos', 'Frases', 'Quiz', 'Progreso']) {
        const box = await bottomNav.getByRole('link', { name: label }).boundingBox();
        expect(box, `BottomNav ${label} should be visible`).not.toBeNull();
        expect(box!.width, `BottomNav ${label} width`).toBeGreaterThanOrEqual(44);
        expect(box!.height, `BottomNav ${label} height`).toBeGreaterThanOrEqual(44);
      }

      for (const route of MOBILE_ROUTES) {
        await page.goto(`${baseURL}#${route}`);
        await expect(page.locator('main')).toBeVisible();
        await assertNoHorizontalOverflow(page, route);

        // Los módulos con onboarding deben permitir entrar con CTA táctil visible.
        const start = page.getByRole('button', { name: 'Empezar Ahora', exact: true });
        if (await start.count()) {
          await assertTouchTarget(page, 'button', 'Empezar Ahora');
          await start.click();
          await assertNoHorizontalOverflow(page, `${route} (vista activa)`);
        }

        const selects = page.locator('select:visible');
        for (let i = 0; i < await selects.count(); i += 1) {
          const appearance = await selects.nth(i).evaluate((el) => getComputedStyle(el).appearance);
          expect(appearance, `${route}: native select #${i} has native appearance`).toBe('none');
        }
      }
    });

    test('Quiz: los tres modos mantienen pregunta visible y muestran solución accesible en el bottom sheet', async ({ page }) => {
      const modes = [
        { label: 'Múltiple', id: 'multiple' },
        { label: 'V/F', id: 'truefalse' },
        { label: 'Ordenar', id: 'scramble' },
      ];

      await page.goto(`${baseURL}#/quiz`);
      await skipRoleOnboarding(page);

      for (const [index, mode] of modes.entries()) {
        if (index > 0) {
          await page.reload();
          await expect(page.getByRole('button', { name: 'Empezar Ahora', exact: true })).toBeVisible();
        }

        await page.getByRole('button', { name: 'Empezar Ahora', exact: true }).click();
        await page.getByRole('radio', { name: mode.label }).click();
        await page.getByRole('button', { name: /empezar entrenamiento/i }).click();

        const question = page.getByTestId('quiz-question');
        await expect(question).toBeVisible({ timeout: 20_000 });
        await assertNoHorizontalOverflow(page, `/quiz/${mode.id}`);

        if (mode.id === 'scramble') {
          const words = page.getByTestId('quiz-word-option');
          await expect(words.first()).toBeVisible();
          let availableWords = await words.count();
          while (availableWords > 0) {
            await words.first().click();
            availableWords -= 1;
            await expect(words).toHaveCount(availableWords);
          }
          await page.getByTestId('quiz-submit-answer').click();
        } else {
          await page.getByTestId('quiz-answer-option').first().click();
        }

        const sheet = page.getByTestId('feedback-sheet');
        await expect(sheet).toBeVisible();
        await expect(sheet).not.toHaveAttribute('aria-modal', 'true');
        await expect(page.getByTestId('quiz-feedback-solution')).not.toHaveText('');
        const questionBox = await question.boundingBox();
        const sheetBox = await sheet.boundingBox();
        expect(questionBox).not.toBeNull();
        expect(sheetBox).not.toBeNull();
        expect(questionBox!.y + questionBox!.height, `${mode.label}: question overlapped by feedback`).toBeLessThanOrEqual(sheetBox!.y);
        await assertNoHorizontalOverflow(page, `/quiz/${mode.id} feedback`);
      }
    });

    test('Frases, dictado, flashcards y diálogos permiten completar su acción táctil principal', async ({ page }) => {
      await page.goto(baseURL);
      await skipRoleOnboarding(page);

      await page.goto(`${baseURL}#/frases`);
      await page.getByRole('button', { name: 'Empezar Ahora', exact: true }).click();
      const tenPhrases = page.getByRole('button', { name: '10', exact: true });
      await expect(tenPhrases).toBeVisible({ timeout: 20_000 });
      await tenPhrases.click();
      const spanishAudio = page.getByRole('button', { name: 'Escuchar frase en español' });
      await expect(spanishAudio).toBeVisible();
      await assertTouchTarget(page, 'button', 'Escuchar frase en español');
      await assertNoHorizontalOverflow(page, '/frases sesión activa');

      await page.goto(`${baseURL}#/dictado`);
      await page.getByRole('button', { name: 'Empezar Ahora', exact: true }).click();
      const dictationPlay = page.getByRole('button', { name: 'Reproducir frase para dictado' });
      await expect(dictationPlay).toBeVisible();
      await assertTouchTarget(page, 'button', 'Reproducir frase para dictado');
      await page.getByRole('textbox', { name: 'Tu respuesta al dictado' }).fill('practice answer');
      await expect(page.getByRole('button', { name: 'Comprobar respuesta' })).toBeVisible();
      await assertNoHorizontalOverflow(page, '/dictado sesión activa');

      await page.goto(`${baseURL}#/flashcards`);
      await page.getByRole('button', { name: 'Empezar Ahora', exact: true }).click();
      const flashcard = page.getByRole('button', { name: /Tarjeta de estudio/ });
      await expect(flashcard).toBeVisible();
      await flashcard.click();
      const flashcardAudio = page.getByRole('button', { name: 'Reproducir audio en Español' });
      await expect(flashcardAudio).toBeVisible();
      await assertTouchTarget(page, 'button', 'Reproducir audio en Español');
      await assertNoHorizontalOverflow(page, '/flashcards traducción');

      await page.goto(`${baseURL}#/conversaciones`);
      await page.getByRole('button', { name: 'Empezar Ahora', exact: true }).click();
      const conversation = page.locator('[data-testid="conversation-list"] button').first();
      await expect(conversation).toBeVisible({ timeout: 20_000 });
      await conversation.click();
      await expect(page.getByRole('button', { name: 'Reproducir conversación completa automáticamente' })).toBeVisible();
      await assertNoHorizontalOverflow(page, '/conversaciones activa');

      await page.goto(`${baseURL}#/roleplay`);
      await page.getByRole('button', { name: 'Empezar Ahora', exact: true }).click();
      const scenario = page.locator('[aria-label="Escenarios de roleplay"] section button').first();
      await expect(scenario).toBeVisible();
      await scenario.click();
      await expect(page.getByText('Tu objetivo')).toBeVisible();
      await assertTouchTarget(page, 'button', 'COMENZAR CONVERSACIÓN');
      await assertNoHorizontalOverflow(page, '/roleplay objetivo');

      await page.goto(`${baseURL}#/examen`);
      await page.getByRole('button', { name: 'Empezar Ahora', exact: true }).click();
      await assertTouchTarget(page, 'button', 'Iniciar Certificación');
      await assertTouchTarget(page, 'button', /Recepción Hotelera/);
      await page.getByRole('button', { name: 'Examen Global' }).click();
      await expect(page.getByLabel('Nombre completo')).toHaveCount(0);
      await assertNoHorizontalOverflow(page, '/examen configuración global');
      await page.getByRole('button', { name: 'Certificación por Rol' }).click();
      await expect(page.getByLabel('Nombre completo')).toBeVisible();
      await assertNoHorizontalOverflow(page, '/examen configuración por rol');
    });

    test('modal de selección de rol se mantiene dentro del viewport y desplazable', async ({ page }) => {
      await page.goto(`${baseURL}#/configuracion`);
      await skipRoleOnboarding(page);
      await page.getByRole('button', { name: 'Cambiar rol' }).click();

      const dialog = page.getByRole('dialog', { name: /puesto de trabajo/i });
      await expect(dialog).toBeVisible();
      const bounds = await dialog.boundingBox();
      expect(bounds).not.toBeNull();
      expect(bounds!.y).toBeGreaterThanOrEqual(0);
      expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(viewport.height);
      await expect(dialog).toHaveCSS('overflow-y', 'auto');

      await page.keyboard.press('Escape');
      await expect(dialog).toHaveCount(0);
      await assertNoHorizontalOverflow(page, '/configuracion modal cerrado');

      await page.goto(`${baseURL}#/frases`);
      await page.getByRole('button', { name: 'Empezar Ahora', exact: true }).click();
      const voiceOpener = page.getByRole('button', { name: 'Ajustes de Voz' });
      await voiceOpener.scrollIntoViewIfNeeded();
      await voiceOpener.click();
      const voiceDialog = page.getByRole('dialog', { name: 'Ajustes de Voz' });
      await expect(voiceDialog).toBeVisible();
      const voiceBounds = await voiceDialog.boundingBox();
      expect(voiceBounds).not.toBeNull();
      expect(voiceBounds!.y).toBeGreaterThanOrEqual(0);
      expect(voiceBounds!.y + voiceBounds!.height).toBeLessThanOrEqual(viewport.height);
      await expect(voiceDialog).toHaveCSS('overflow-y', 'auto');
      await voiceDialog.getByRole('button', { name: 'Avanzado' }).click();
      await expect(voiceDialog.getByLabel('Tono')).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(voiceDialog).toHaveCount(0);
      await expect(voiceOpener).toBeFocused();
      await assertNoHorizontalOverflow(page, '/configuracion ajustes de voz');
    });
  });
}
