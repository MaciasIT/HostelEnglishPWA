import { describe, it, expect } from 'vitest';
import { signDiploma, verifyDiplomaCode, buildDiplomaSvg, qrMatrix, shortCode, type DiplomaData } from './diploma';

const data: DiplomaData = { studentName: 'Ana <García>', department: 'Recepción Hotelera', grade: 87.4, date: '2026-11-01', certId: 'c1' };

async function keys() {
  const pair = (await crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify'])) as CryptoKeyPair;
  return { privateKey: pair.privateKey, publicRaw: new Uint8Array(await crypto.subtle.exportKey('raw', pair.publicKey)) };
}

describe('diploma', () => {
  it('firma y verifica offline', async () => {
    const d = await signDiploma(data, await keys());
    const r = await verifyDiplomaCode(d.code);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.studentName).toBe(data.studentName);
      expect(r.data.grade).toBe(87);
    }
  });
  it('detecta manipulación del payload', async () => {
    const d = await signDiploma(data, await keys());
    const parts = d.code.split('.');
    const other = await signDiploma({ ...data, grade: 10 }, await keys());
    parts[1] = other.code.split('.')[1];
    expect((await verifyDiplomaCode(parts.join('.'))).ok).toBe(false);
  });
  it('rechaza formato inválido', async () => {
    expect((await verifyDiplomaCode('basura')).ok).toBe(false);
  });
  it('QR es matriz cuadrada', () => {
    const m = qrMatrix('hola');
    expect(m.length).toBeGreaterThan(20);
    expect(m.every((r) => r.length === m.length)).toBe(true);
  });
  it('SVG incluye datos escapados, QR y código corto', async () => {
    const d = await signDiploma(data, await keys());
    const svg = buildDiplomaSvg(d);
    expect(svg).toContain('Ana &lt;García&gt;');
    expect(svg).toContain('Recepción Hotelera');
    expect(svg).toContain('87/100');
    expect(svg).toContain(shortCode(d.code));
    expect(svg).toMatch(/<g fill="#000"><rect/);
  });
});
