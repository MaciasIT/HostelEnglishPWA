import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useAppStore } from '@/store/useAppStore';
import { setTestPublicKeyOverride, clearTestPublicKeyOverride } from '@/services/licenseService';

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

describe('licenseSlice', () => {
  let publicKey: CryptoKey;
  let privateKey: CryptoKey;

  beforeEach(async () => {
    vi.clearAllMocks();
    try {
      const pair = await generateTestKeyPair();
      publicKey = pair.publicKey;
      privateKey = pair.privateKey;
      await setTestPublicKeyOverride(publicKey);
    } catch (err) {
      console.warn('[licenseSlice.test] Web Crypto no disponible, tests saltados:', err);
    }

    useAppStore.setState({
      isPremium: false,
      licenseInfo: null,
    });
  });

  afterEach(async () => {
    await clearTestPublicKeyOverride();
  });

  const buildPayload = (overrides: Partial<any> = {}): any => ({
    email: 'test@example.com',
    tier: 'pro',
    type: 'lifetime',
    issuedAt: Date.now(),
    expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
    ...overrides,
  });

  const sign = async (payload: any): Promise<string> => {
    const payloadBytes = new TextEncoder().encode(JSON.stringify(payload));
    const signature = await crypto.subtle.sign({ name: 'Ed25519' }, privateKey, payloadBytes);
    return `${base64UrlEncode(payloadBytes)}.${base64UrlEncode(new Uint8Array(signature))}`;
  };

  it('debería activar el modo premium con una licencia válida', async () => {
    const token = await sign(buildPayload());

    const result = await useAppStore.getState().activateLicense(token);
    expect(result.success).toBe(true);

    const state = useAppStore.getState();
    expect(state.isPremium).toBe(true);
    expect(state.licenseInfo?.email).toBe('test@example.com');
  });

  it('debería rechazar una licencia inválida sin cambiar el estado', async () => {
    const result = await useAppStore.getState().activateLicense('invalid-token');
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();

    const state = useAppStore.getState();
    expect(state.isPremium).toBe(false);
    expect(state.licenseInfo).toBeNull();
  });

  it('debería desactivar la licencia y limpiar el estado', async () => {
    const token = await sign(buildPayload());

    await useAppStore.getState().activateLicense(token);
    expect(useAppStore.getState().isPremium).toBe(true);

    useAppStore.getState().deactivateLicense();
    const state = useAppStore.getState();
    expect(state.isPremium).toBe(false);
    expect(state.licenseInfo).toBeNull();
  });
});
