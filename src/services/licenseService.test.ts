import { describe, it, expect, beforeEach } from 'vitest';
import {
  verifyLicenseToken,
  type LicensePayload,
  resetDevicePromoTrackingForTesting,
  PROMO_DURATION_MS,
} from '@/services/licenseService';

function base64UrlEncode(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

async function generateTestKeyPair(): Promise<{ publicKey: CryptoKey; privateKey: CryptoKey }> {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    throw new Error('Web Crypto API no disponible en este entorno.');
  }

  const keyPair = await crypto.subtle.generateKey(
    { name: 'Ed25519' },
    true,
    ['sign', 'verify']
  );
  return keyPair as unknown as { publicKey: CryptoKey; privateKey: CryptoKey };
}

describe('licenseService', () => {
  let publicKey: CryptoKey;
  let privateKey: CryptoKey;

  beforeEach(async () => {
    resetDevicePromoTrackingForTesting();
    try {
      const pair = await generateTestKeyPair();
      publicKey = pair.publicKey;
      privateKey = pair.privateKey;
    } catch (err) {
      console.warn('[licenseService.test] Web Crypto no disponible, tests saltados:', err);
    }
  });

  const buildPayload = (overrides: Partial<LicensePayload> = {}): LicensePayload => ({
    email: 'test@example.com',
    tier: 'pro',
    type: 'lifetime',
    issuedAt: Date.now(),
    expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
    ...overrides,
  });

  const sign = async (payload: LicensePayload): Promise<string> => {
    const payloadBytes = new TextEncoder().encode(JSON.stringify(payload));
    const signature = await crypto.subtle.sign({ name: 'Ed25519' }, privateKey, payloadBytes);
    return `${base64UrlEncode(payloadBytes)}.${base64UrlEncode(new Uint8Array(signature))}`;
  };

  it('debería aceptar una licencia válida', async () => {
    const token = await sign(buildPayload());
    const result = verifyLicenseToken(token, publicKey);
    expect((await result).ok).toBe(true);
    expect((await result).details?.email).toBe('test@example.com');
    expect((await result).details?.tier).toBe('pro');
  });

  it('debería rechazar una licencia caducada', async () => {
    const token = await sign(
      buildPayload({ expiresAt: Date.now() - 1000 })
    );
    const result = await verifyLicenseToken(token, publicKey);
    expect((await result).ok).toBe(false);
    expect((await result).error).toBe('Licencia caducada.');
  });

  it('debería rechazar firmas manipuladas', async () => {
    let token = await sign(buildPayload());
    token = token.slice(0, -5) + 'xxxxx';
    const result = await verifyLicenseToken(token, publicKey);
    expect((await result).ok).toBe(false);
    expect((await result).error).toBe('Firma de licencia inválida.');
  });

  it('debería rechazar tokens con formato incorrecto', async () => {
    const result = await verifyLicenseToken('not-a-token', publicKey);
    expect((await result).ok).toBe(false);
    expect((await result).error).toBe('Formato de licencia inválido.');
  });

  it('debería activar códigos de promoción por 3 meses (90 días) y restringir un solo uso por dispositivo', async () => {
    const before = Date.now();
    const res1 = await verifyLicenseToken('HOSTEL-PRO-2026');
    expect(res1.ok).toBe(true);
    expect(res1.details?.tier).toBe('pro');
    expect(res1.details?.type).toBe('quarterly');
    expect(res1.details?.expiresAt).toBeGreaterThanOrEqual(before + PROMO_DURATION_MS - 50);

    // Segundo intento con el mismo código en este dispositivo: DEBE fallar
    const resDuplicate = await verifyLicenseToken('HOSTEL-PRO-2026');
    expect(resDuplicate.ok).toBe(false);
    expect(resDuplicate.error).toBe('Este código promocional ya ha sido utilizado en este dispositivo.');

    // Intento con otro código de la misma campaña en este dispositivo: DEBE fallar
    const resOtherCode = await verifyLicenseToken('DEV-VIP-OVERRIDE');
    expect(resOtherCode.ok).toBe(false);
    expect(resOtherCode.error).toBe('Este dispositivo ya ha disfrutado de la promoción de 3 meses.');

    // En otro dispositivo (simulado limpiando el almacenamiento local del dispositivo): DEBE funcionar
    resetDevicePromoTrackingForTesting();
    const resOtherDevice = await verifyLicenseToken('DEV-VIP-OVERRIDE');
    expect(resOtherDevice.ok).toBe(true);
    expect(resOtherDevice.details?.type).toBe('quarterly');
  });
});

