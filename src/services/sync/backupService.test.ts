import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '@/store/useAppStore';
import {
  BackupError,
  createBackupPayload,
  parseBackupPayload,
  importBackupPayload,
  collectState,
  gzipCompress,
  gzipDecompress,
  toBase64Url,
  fromBase64Url,
  planQrFrames,
  QrFrameAssembler,
  qrMatrixM,
  readBackupFile,
  backupFileName,
  summarizeState,
  SINGLE_QR_MAX_CHARS,
} from './backupService';

const seed = () =>
  useAppStore.setState({
    progress: { '12': 2 } as never,
    reviewItems: {},
    dailyActivity: { '2026-11-01': 3 },
    achievements: ['first'],
    isPremium: true,
    licenseInfo: { email: 'a@b.c', tier: 'pro', type: 'promo', issuedAt: 1, expiresAt: 2 } as never,
  } as never);

describe('backupService', () => {
  beforeEach(() => {
    seed();
  });

  it('base64url hace roundtrip de bytes arbitrarios', () => {
    const bytes = Uint8Array.from({ length: 300 }, (_, i) => (i * 7) % 256);
    const enc = toBase64Url(bytes);
    expect(enc).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(Array.from(fromBase64Url(enc))).toEqual(Array.from(bytes));
  });

  it('gzip comprime y descomprime sin pérdida', async () => {
    const data = new TextEncoder().encode('hostel '.repeat(2000));
    const gz = await gzipCompress(data);
    expect(gz.length).toBeLessThan(data.length / 10);
    expect(Array.from(await gzipDecompress(gz))).toEqual(Array.from(data));
  });

  it('rechaza datos gzip corruptos', async () => {
    await expect(gzipDecompress(new Uint8Array([1, 2, 3, 4]))).rejects.toBeInstanceOf(BackupError);
  });

  it('exporta e importa el estado completo (roundtrip)', async () => {
    const before = collectState();
    const payload = await createBackupPayload();
    useAppStore.setState({ progress: {}, achievements: [], isPremium: false, licenseInfo: null, dailyActivity: {} } as never);
    await importBackupPayload(payload);
    const after = collectState();
    expect(after).toEqual(before);
    expect(useAppStore.getState().isPremium).toBe(true);
    expect(useAppStore.getState().licenseInfo?.email).toBe('a@b.c');
  });

  it('detecta manipulación (firma SHA-256)', async () => {
    const state = collectState();
    const payload = await createBackupPayload(state);
    const gz = fromBase64Url(payload);
    const env = JSON.parse(new TextDecoder().decode(await gzipDecompress(gz)));
    env.state.achievements = ['hack'];
    const forged = toBase64Url(await gzipCompress(new TextEncoder().encode(JSON.stringify(env))));
    await expect(parseBackupPayload(forged)).rejects.toMatchObject({ code: 'INTEGRITY' });
  });

  it('rechaza basura y sobres con magic incorrecto sin tocar el store', async () => {
    const snapshot = collectState();
    await expect(parseBackupPayload('')).rejects.toMatchObject({ code: 'FORMAT' });
    await expect(parseBackupPayload('!!!')).rejects.toMatchObject({ code: 'FORMAT' });
    const bad = toBase64Url(await gzipCompress(new TextEncoder().encode('{"magic":"X"}')));
    await expect(importBackupPayload(bad)).rejects.toMatchObject({ code: 'FORMAT' });
    expect(collectState()).toEqual(snapshot);
  });

  it('rechaza estado que no cumple el esquema Zod', async () => {
    const state = collectState() as unknown as Record<string, unknown>;
    state.dailyActivity = { x: -5 };
    const { sha256Hex } = await import('./backupService');
    const env = { magic: 'HEB', v: 1, createdAt: 1, sha256: await sha256Hex(JSON.stringify(state)), state };
    const payload = toBase64Url(await gzipCompress(new TextEncoder().encode(JSON.stringify(env))));
    await expect(parseBackupPayload(payload)).rejects.toMatchObject({ code: 'SCHEMA' });
  });

  it('un estado típico cabe en un único QR nivel M', async () => {
    const payload = await createBackupPayload();
    const plan = planQrFrames(payload);
    expect(payload.length).toBeLessThan(SINGLE_QR_MAX_CHARS);
    expect(plan.mode).toBe('single');
    const m = qrMatrixM(plan.frames[0].text);
    expect(m.length).toBeGreaterThan(20);
  });

  it('fragmenta cuando excede un QR y el ensamblador reconstruye en desorden', () => {
    const payload = toBase64Url(Uint8Array.from({ length: 4000 }, (_, i) => (i * 31 + 7) % 256));
    const plan = planQrFrames(payload);
    expect(plan.mode).toBe('multi');
    expect(plan.frames.length).toBeGreaterThan(1);
    const asm = new QrFrameAssembler();
    for (const f of [...plan.frames].reverse()) asm.add(f.text);
    asm.add(plan.frames[0].text); // repetido
    expect(asm.complete).toBe(true);
    expect(asm.assemble()).toBe(payload);
  });

  it('el ensamblador ignora texto ajeno y falla si faltan fragmentos', () => {
    const payload = 'A'.repeat(3000);
    const plan = planQrFrames(payload);
    const asm = new QrFrameAssembler();
    expect(asm.add('https://example.com')).toBe(false);
    asm.add(plan.frames[0].text);
    expect(() => asm.assemble()).toThrowError(BackupError);
  });

  it('cae a fichero si hay demasiados fragmentos', () => {
    expect(planQrFrames('A'.repeat(100000)).mode).toBe('file');
  });

  it('lee ficheros .he-backup y rechaza otras extensiones', async () => {
    const payload = await createBackupPayload();
    const file = new File([payload], backupFileName(), { type: 'application/octet-stream' });
    expect(file.name.endsWith('.he-backup')).toBe(true);
    expect(await readBackupFile(file)).toBe(payload);
    await expect(readBackupFile(new File(['x'], 'a.txt'))).rejects.toMatchObject({ code: 'FORMAT' });
  });

  it('summarizeState resume el contenido', () => {
    const s = summarizeState(collectState());
    expect(s.premium).toBe(true);
    expect(s.achievements).toBe(1);
  });
});
