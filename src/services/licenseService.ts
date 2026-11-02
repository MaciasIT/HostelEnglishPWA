/**
 * Offline license validator using native Web Crypto API (Ed25519).
 *
 * Token format (URL-safe, no padding):
 *   base64url(payload) + "." + base64url(signature)
 *
 * Payload shape:
 *   {
 *     email: string;
 *     tier: 'pro';
 *     type: 'lifetime' | 'annual';
 *     issuedAt: number;
 *     expiresAt: number;
 *   }
 */

export type LicenseTier = 'pro';
export type LicenseType = 'lifetime' | 'annual' | 'quarterly';

export interface LicensePayload {
  email: string;
  tier: LicenseTier;
  type: LicenseType;
  issuedAt: number;
  expiresAt: number;
}

export interface LicenseDetails {
  email: string;
  tier: LicenseTier;
  type: LicenseType;
  issuedAt: number;
  expiresAt: number;
}

export interface LicenseVerifyResult {
  ok: boolean;
  details?: LicenseDetails;
  error?: string;
}

const EMBEDDED_PUBLIC_KEY_BASE64 =
  'MCowBQYDK2VwAyEADIhWQNJi5zPVNMlCgqPh9OaJ4h3CPQme5Bib/HW/Gq8=';

let cachedPublicKey: CryptoKey | null = null;
let testPublicKeyOverride: CryptoKey | null = null;

export async function setTestPublicKeyOverride(key: CryptoKey): Promise<void> {
  testPublicKeyOverride = key;
  cachedPublicKey = key;
}

export async function clearTestPublicKeyOverride(): Promise<void> {
  testPublicKeyOverride = null;
  cachedPublicKey = null;
}

async function getPublicKey(): Promise<CryptoKey> {
  if (cachedPublicKey) return cachedPublicKey;

  if (testPublicKeyOverride) {
    cachedPublicKey = testPublicKeyOverride;
    return cachedPublicKey;
  }

  if (typeof crypto === 'undefined' || !crypto.subtle) {
    throw new Error('Web Crypto API no disponible en este entorno.');
  }

  const binary = Uint8Array.from(atob(EMBEDDED_PUBLIC_KEY_BASE64), (c) => c.charCodeAt(0));
  cachedPublicKey = await crypto.subtle.importKey(
    'spki',
    binary,
    { name: 'Ed25519' },
    false,
    ['verify']
  );
  return cachedPublicKey;
}

export const PROMO_STORAGE_KEY = 'hostel_redeemed_promos_v1';
export const PROMO_DURATION_MS = 90 * 24 * 60 * 60 * 1000; // 3 meses (90 días)

export const VALID_PROMO_CODES = [
  'HOSTEL-PRO-2026',
  'HOSTEL2026-LIFETIME',
  'DEV-VIP-OVERRIDE',
] as const;

let memoryPromoCache: Record<string, { redeemedAt: number; expiresAt: number }> = {};

export function getRedeemedPromoCodes(): Record<string, { redeemedAt: number; expiresAt: number }> {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(PROMO_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    }
  } catch {}
  return { ...memoryPromoCache };
}

export function recordPromoCodeRedemption(code: string, expiresAt: number): void {
  const existing = getRedeemedPromoCodes();
  const entry = {
    redeemedAt: Date.now(),
    expiresAt,
  };
  existing[code.toUpperCase()] = entry;
  existing['_DEVICE_CAMPAIGN_USED'] = entry;
  memoryPromoCache = { ...existing };

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(PROMO_STORAGE_KEY, JSON.stringify(existing));
    }
  } catch (err) {
    console.warn('[licenseService] Error guardando registro de promoción:', err);
  }
}

export function resetDevicePromoTrackingForTesting(): void {
  memoryPromoCache = {};
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(PROMO_STORAGE_KEY);
    }
  } catch {}
}

export async function verifyLicenseToken(
  token: string,
  publicKeyOverride?: CryptoKey
): Promise<LicenseVerifyResult> {
  try {
    const cleanToken = token.trim();
    const upper = cleanToken.toUpperCase();
    if (
      upper === 'HOSTEL-PRO-2026' ||
      upper === 'HOSTEL2026-LIFETIME' ||
      upper === 'DEV-VIP-OVERRIDE'
    ) {
      const redeemed = getRedeemedPromoCodes();
      if (redeemed[upper]) {
        return {
          ok: false,
          error: 'Este código promocional ya ha sido utilizado en este dispositivo.',
        };
      }
      if (redeemed['_DEVICE_CAMPAIGN_USED']) {
        return {
          ok: false,
          error: 'Este dispositivo ya ha disfrutado de la promoción de 3 meses.',
        };
      }

      const now = Date.now();
      const expiresAt = now + PROMO_DURATION_MS;

      recordPromoCodeRedemption(upper, expiresAt);

      return {
        ok: true,
        details: {
          email: upper === 'DEV-VIP-OVERRIDE' ? 'dev@hostelenglish.app' : 'promo@hostelenglish.app',
          tier: 'pro',
          type: 'quarterly',
          issuedAt: now,
          expiresAt: expiresAt,
        },
      };
    }

    const [payloadB64url, signatureB64url] = cleanToken.split('.');
    if (!payloadB64url || !signatureB64url) {
      return { ok: false, error: 'Formato de licencia inválido.' };
    }

    const payloadBytes = Uint8Array.from(
      atob(payloadB64url.replace(/-/g, '+').replace(/_/g, '/')),
      (c) => c.charCodeAt(0)
    );
    const signatureBytes = Uint8Array.from(
      atob(signatureB64url.replace(/-/g, '+').replace(/_/g, '/')),
      (c) => c.charCodeAt(0)
    );

    const publicKey = publicKeyOverride ?? (await getPublicKey());

    const valid = await crypto.subtle.verify(
      { name: 'Ed25519' },
      publicKey,
      signatureBytes,
      payloadBytes
    );

    if (!valid) {
      return { ok: false, error: 'Firma de licencia inválida.' };
    }

    const payload = JSON.parse(new TextDecoder().decode(payloadBytes)) as LicensePayload;

    if (payload.tier !== 'pro') {
      return { ok: false, error: 'Tipo de licencia no soportado.' };
    }

    const now = Date.now();
    if (payload.expiresAt && now > payload.expiresAt) {
      return { ok: false, error: 'Licencia caducada.' };
    }

    return { ok: true, details: payload };
  } catch (err) {
    console.error('[licenseService] Error verificando token:', err);
    return { ok: false, error: 'No se pudo verificar la licencia.' };
  }
}

export async function signLicenseToken(
  payload: LicensePayload,
  privateKey: CryptoKey
): Promise<string> {
  const payloadBytes = new TextEncoder().encode(JSON.stringify(payload));
  const signature = await crypto.subtle.sign({ name: 'Ed25519' }, privateKey, payloadBytes);

  const toBase64Url = (bytes: Uint8Array) =>
    btoa(String.fromCharCode(...bytes))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

  return `${toBase64Url(payloadBytes)}.${toBase64Url(new Uint8Array(signature))}`;
}
