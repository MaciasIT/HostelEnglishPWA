import { StateCreator } from 'zustand';
import { verifyLicenseToken, type LicenseDetails, type LicenseVerifyResult } from '../../services/licenseService';

export interface LicenseSlice {
  isPremium: boolean;
  licenseInfo: LicenseDetails | null;
  activateLicense: (key: string) => Promise<{ success: boolean; error?: string }>;
  deactivateLicense: () => void;
}

export const createLicenseSlice: StateCreator<LicenseSlice> = (set) => ({
  isPremium: false,
  licenseInfo: null,

  activateLicense: async (key) => {
    try {
      const result: LicenseVerifyResult = await verifyLicenseToken(key);
      if (!result.ok || !result.details) {
        return { success: false, error: result.error ?? 'Licencia inválida.' };
      }

      set({ isPremium: true, licenseInfo: result.details });
      return { success: true };
    } catch (err) {
      console.error('[licenseSlice] Error activando licencia:', err);
      return { success: false, error: 'No se pudo validar la licencia.' };
    }
  },

  deactivateLicense: () => set({ isPremium: false, licenseInfo: null }),
});
