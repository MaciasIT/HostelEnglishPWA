import { describe, it, expect, beforeEach } from 'vitest';
import { verifyLicenseToken, type LicensePayload } from '@/services/licenseService';

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

  it('debería rechazar tokens sin tier "pro"', async () => {
    const token = await sign(buildPayload({ tier: 'basic' as any }));
    const result = await verifyLicenseToken(token, publicKey);
    expect((await result).ok).toBe(false);
    expect((await result).error).toBe('Tipo de licencia no soportado.');
  });
});
