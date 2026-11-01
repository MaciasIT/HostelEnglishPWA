import { expect, type Page } from '@playwright/test';

/** Ruta base de la PWA (HashRouter + base Vite). */
export const baseURL = '/HostelEnglishPWA/';

/**
 * Descarta el modal de onboarding de rol laboral.
 * En primer arranque (sin `selectedRole`) la app muestra un diálogo modal que
 * bloquea la interacción; sólo aparece cuando termina la hidratación, así que
 * se espera a que esté visible antes de seleccionar un rol.
 */
export async function skipRoleOnboarding(page: Page): Promise<void> {
  const dialog = page.getByRole('dialog', { name: /puesto de trabajo/i });
  await expect(dialog).toBeVisible({ timeout: 20_000 });
  await dialog.getByRole('radio').first().click();
  await expect(dialog).toHaveCount(0);
}