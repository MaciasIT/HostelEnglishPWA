import { verifyDiplomaCode, type DiplomaData } from '@/features/progress/lib/diploma';

export type DeptId = 'sala' | 'barra' | 'recepcion' | 'pisos' | 'mantenimiento';
export type OralLevel = 'A2' | 'B1' | 'B2';
export type AreaId = 'alergenos' | 'quejas' | 'cobros';
export type HeatLevel = 'ok' | 'warn' | 'critical' | 'none';

export const DEPARTMENTS: { id: DeptId; label: string }[] = [
  { id: 'sala', label: 'Sala' },
  { id: 'barra', label: 'Barra' },
  { id: 'recepcion', label: 'Recepción' },
  { id: 'pisos', label: 'Pisos' },
  { id: 'mantenimiento', label: 'Mantenimiento' },
];

/** Departamentos cuyo personal cubre cada área crítica (criterio de auditoría documentado en la UI). */
export const AREAS: { id: AreaId; label: string; depts: DeptId[] }[] = [
  { id: 'alergenos', label: 'Alérgenos', depts: ['sala', 'barra'] },
  { id: 'quejas', label: 'Quejas graves', depts: ['recepcion', 'sala', 'pisos'] },
  { id: 'cobros', label: 'Cobros / Facturación', depts: ['recepcion', 'barra', 'sala'] },
];

export const PASS_GRADE = 70;
export const ALLERGEN_THRESHOLD = 70;

export interface StaffEntry extends DiplomaData {
  dept: DeptId | null;
  code: string;
}

const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export function mapDepartment(raw: string): DeptId | null {
  const s = norm(raw);
  if (/recep/.test(s)) return 'recepcion';
  if (/manten/.test(s)) return 'mantenimiento';
  if (/limpie|pisos|gobern/.test(s)) return 'pisos';
  if (/restaur|sala|mesa|cocina|comedor/.test(s)) return 'sala';
  if (/bar|cafeter/.test(s)) return 'barra';
  return null;
}

export function oralLevel(grade: number): OralLevel {
  if (grade >= 85) return 'B2';
  if (grade >= PASS_GRADE) return 'B1';
  return 'A2';
}

export interface ImportResult {
  entries: StaffEntry[];
  invalid: string[];
  duplicates: number;
}

/** Extrae y verifica (Ed25519 offline) los códigos HE1.* pegados; ignora duplicados. */
export async function importCodes(text: string, existing: StaffEntry[] = []): Promise<ImportResult> {
  const tokens = text.split(/[\s,;]+/).map((t) => t.trim()).filter(Boolean);
  const seen = new Set(existing.map((e) => e.code));
  const entries: StaffEntry[] = [];
  const invalid: string[] = [];
  let duplicates = 0;
  for (const tok of tokens) {
    if (seen.has(tok)) {
      duplicates++;
      continue;
    }
    const r = await verifyDiplomaCode(tok);
    if (!r.ok) {
      invalid.push(tok.length > 24 ? `${tok.slice(0, 24)}…` : tok);
      continue;
    }
    seen.add(tok);
    entries.push({ ...r.data, dept: mapDepartment(r.data.department), code: tok });
  }
  return { entries, invalid, duplicates };
}

export interface DeptStat {
  id: DeptId;
  label: string;
  headcount: number;
  imported: number;
  certified: number;
  pct: number | null;
  avgGrade: number | null;
  level: OralLevel | null;
}

export interface AreaRow {
  id: AreaId;
  label: string;
  cells: { dept: DeptId; label: string; grade: number | null; heat: HeatLevel; relevant: boolean }[];
}

export interface Alert {
  dept: DeptId;
  label: string;
  pct: number;
  message: string;
}

export interface AuditSummary {
  depts: DeptStat[];
  areas: AreaRow[];
  alerts: Alert[];
  totalStaff: number;
  totalCertified: number;
  overallPct: number | null;
  avgLevel: OralLevel | null;
  levelCounts: Record<OralLevel, number>;
}

export type Headcount = Partial<Record<DeptId, number>>;

export function heatFor(grade: number | null): HeatLevel {
  if (grade == null) return 'none';
  if (grade >= 80) return 'ok';
  if (grade >= PASS_GRADE) return 'warn';
  return 'critical';
}

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

export function computeAudit(entries: StaffEntry[], headcount: Headcount = {}): AuditSummary {
  const levelCounts: Record<OralLevel, number> = { A2: 0, B1: 0, B2: 0 };
  const depts: DeptStat[] = DEPARTMENTS.map(({ id, label }) => {
    const list = entries.filter((e) => e.dept === id);
    const certifiedList = list.filter((e) => e.grade >= PASS_GRADE);
    const declared = Math.max(0, Math.floor(headcount[id] ?? 0));
    const total = Math.max(declared, list.length);
    const grade = avg(list.map((e) => e.grade));
    list.forEach((e) => levelCounts[oralLevel(e.grade)]++);
    return {
      id,
      label,
      headcount: total,
      imported: list.length,
      certified: certifiedList.length,
      pct: total > 0 ? Math.round((certifiedList.length / total) * 100) : null,
      avgGrade: grade == null ? null : Math.round(grade),
      level: grade == null ? null : oralLevel(grade),
    };
  });

  const areas: AreaRow[] = AREAS.map((a) => ({
    id: a.id,
    label: a.label,
    cells: DEPARTMENTS.map((d) => {
      const relevant = a.depts.includes(d.id);
      const stat = depts.find((x) => x.id === d.id)!;
      return {
        dept: d.id,
        label: d.label,
        relevant,
        grade: relevant ? stat.avgGrade : null,
        heat: relevant ? heatFor(stat.avgGrade) : 'none',
      };
    }),
  }));

  // Alerta roja: Sala (incluye cocina/restaurante) con <70% certificado. Sin datos no se alerta.
  const alerts: Alert[] = depts
    .filter((d) => d.id === 'sala' && d.pct !== null && d.pct < ALLERGEN_THRESHOLD)
    .map((d) => ({
      dept: d.id,
      label: d.label,
      pct: d.pct as number,
      message: `${d.label}: solo el ${d.pct}% del personal está certificado en protocolos de alérgenos (mínimo ${ALLERGEN_THRESHOLD}%).`,
    }));

  const totalStaff = depts.reduce((s, d) => s + d.headcount, 0);
  const totalCertified = depts.reduce((s, d) => s + d.certified, 0);
  const grade = avg(entries.map((e) => e.grade));
  return {
    depts,
    areas,
    alerts,
    totalStaff,
    totalCertified,
    overallPct: totalStaff > 0 ? Math.round((totalCertified / totalStaff) * 100) : null,
    avgLevel: grade == null ? null : oralLevel(grade),
    levelCounts,
  };
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Documento HTML autocontenido e imprimible del "Certificado de Calidad Lingüística del Establecimiento". */
export function buildReportHtml(summary: AuditSummary, establishment: string, dateISO: string): string {
  const name = esc(establishment.trim() || 'Establecimiento sin nombre');
  const rows = summary.depts
    .map(
      (d) =>
        `<tr><th scope="row">${esc(d.label)}</th><td>${d.headcount}</td><td>${d.certified}</td><td>${d.pct ?? '—'}${d.pct == null ? '' : '%'}</td><td>${d.level ?? '—'}</td></tr>`
    )
    .join('');
  const heat = summary.areas
    .map(
      (a) =>
        `<tr><th scope="row">${esc(a.label)}</th>${a.cells
          .map((c) => `<td>${!c.relevant ? 'n/a' : c.grade == null ? 'Sin datos' : `${c.grade} (${HEAT_LABEL[c.heat]})`}</td>`)
          .join('')}</tr>`
    )
    .join('');
  const alerts = summary.alerts.length
    ? `<section class="alert"><h2>Alertas de diagnóstico</h2><ul>${summary.alerts.map((a) => `<li>${esc(a.message)}</li>`).join('')}</ul></section>`
    : '<p>Sin alertas críticas de alérgenos.</p>';
  const compliant = summary.alerts.length === 0 && summary.overallPct !== null && summary.overallPct >= 70;
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Certificado de Calidad Lingüística — ${name}</title>
<style>@page{size:A4;margin:16mm}body{font-family:Georgia,serif;color:#111;margin:0;line-height:1.4}h1{text-align:center;letter-spacing:2px;font-size:22pt;margin:0 0 4px}
.sub{text-align:center;color:#333;margin-bottom:18px}table{width:100%;border-collapse:collapse;margin:8px 0 18px}th,td{border:1px solid #333;padding:6px 8px;text-align:left;font-size:11pt}
thead th{background:#eee}.alert{border:3px solid #7f1d1d;padding:8px 12px;margin:12px 0}.verdict{font-weight:bold;font-size:14pt;text-align:center;border:2px solid #111;padding:10px;margin:14px 0}
.foot{font-size:9pt;color:#333;margin-top:20px}</style></head><body>
<h1>CERTIFICADO DE CALIDAD LINGÜÍSTICA</h1><p class="sub">${name} · Emitido el ${esc(dateISO)} · HostelEnglish</p>
<div class="verdict">${compliant ? 'Plantilla APTA para atención internacional' : 'Plantilla con ÁREAS DE MEJORA pendientes'} — ${summary.totalCertified}/${summary.totalStaff} certificados${summary.overallPct == null ? '' : ` (${summary.overallPct}%)`} · Nivel oral medio: ${summary.avgLevel ?? '—'}</div>
<h2>Plantilla certificada por departamento</h2><table><thead><tr><th>Departamento</th><th>Plantilla</th><th>Certificados</th><th>% certificado</th><th>Nivel oral medio</th></tr></thead><tbody>${rows}</tbody></table>
<h2>Áreas críticas (nota media del personal)</h2><table><thead><tr><th>Área</th>${DEPARTMENTS.map((d) => `<th>${d.label}</th>`).join('')}</tr></thead><tbody>${heat}</tbody></table>
${alerts}
<p class="foot">Certificación individual verificada offline mediante firma Ed25519 de cada código de diploma. Niveles orales estimados: A2 &lt; 70, B1 70–84, B2 ≥ 85 sobre 100. Documento generado automáticamente para auditorías de turismo, calidad o turoperadores.</p>
</body></html>`;
}

export const HEAT_LABEL: Record<HeatLevel, string> = {
  ok: 'Sólido',
  warn: 'Mejorable',
  critical: 'Crítico',
  none: 'Sin datos',
};

export function printReport(html: string, target?: Window | null): boolean {
  const w = target ?? window.open('', '_blank');
  if (!w) return false;
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 250);
  return true;
}
