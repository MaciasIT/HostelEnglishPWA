import { describe, it, expect } from 'vitest';
import { signDiploma, type DiplomaData } from '@/features/progress/lib/diploma';
import { mapDepartment, oralLevel, importCodes, computeAudit, buildReportHtml, type StaffEntry } from './equipoAudit';

async function keys() {
  const pair = (await crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify'])) as CryptoKeyPair;
  return { privateKey: pair.privateKey, publicRaw: new Uint8Array(await crypto.subtle.exportKey('raw', pair.publicKey)) };
}
const mk = (name: string, department: string, grade: number): DiplomaData => ({ studentName: name, department, grade, date: '2026-11-02', certId: name });
const entry = (name: string, department: string, grade: number): StaffEntry => ({ ...mk(name, department, grade), dept: mapDepartment(department), code: name });

describe('equipoAudit', () => {
  it('mapea departamentos', () => {
    expect(mapDepartment('Recepción Hotelera')).toBe('recepcion');
    expect(mapDepartment('Restaurante / Servicio de Mesa')).toBe('sala');
    expect(mapDepartment('Limpieza y Pisos')).toBe('pisos');
    expect(mapDepartment('Barra y Cafetería')).toBe('barra');
    expect(mapDepartment('Mantenimiento')).toBe('mantenimiento');
    expect(mapDepartment('Otro')).toBeNull();
  });
  it('niveles orales', () => {
    expect([60, 70, 84, 85].map(oralLevel)).toEqual(['A2', 'B1', 'B1', 'B2']);
  });
  it('importa códigos válidos, rechaza inválidos y duplicados', async () => {
    const k = await keys();
    const a = await signDiploma(mk('Ana', 'Barra y Cafetería', 90), k);
    const r = await importCodes(`${a.code}\nHE1.basura.x.y\n${a.code}`);
    expect(r.entries).toHaveLength(1);
    expect(r.invalid).toHaveLength(1);
    expect(r.duplicates).toBe(1);
    expect(r.entries[0].dept).toBe('barra');
  });
  it('calcula % por departamento y alerta si Sala < 70%', () => {
    const s = computeAudit([entry('a', 'Restaurante', 90), entry('b', 'Restaurante', 50), entry('c', 'Restaurante', 40), entry('d', 'Recepción', 75)], { recepcion: 2 });
    expect(s.depts.find((d) => d.id === 'sala')!.pct).toBe(33);
    expect(s.depts.find((d) => d.id === 'recepcion')!.pct).toBe(50);
    expect(s.alerts).toHaveLength(1);
    expect(s.overallPct).toBe(40);
    expect(s.areas[0].cells.find((c) => c.dept === 'sala')!.heat).toBe('critical');
  });
  it('sin alerta si Sala ≥ 70% o sin datos', () => {
    expect(computeAudit([entry('a', 'Restaurante', 90)]).alerts).toHaveLength(0);
    expect(computeAudit([]).alerts).toHaveLength(0);
  });
  it('el informe escapa HTML', () => {
    const html = buildReportHtml(computeAudit([entry('a', 'Restaurante', 90)]), '<b>Hotel</b>', '2026-11-02');
    expect(html).toContain('CERTIFICADO DE CALIDAD LINGÜÍSTICA');
    expect(html).not.toContain('<b>Hotel</b>');
  });
});
