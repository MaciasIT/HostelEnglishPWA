import React, { useEffect, useMemo, useState } from 'react';
import {
  AREAS,
  DEPARTMENTS,
  HEAT_LABEL,
  buildReportHtml,
  computeAudit,
  importCodes,
  printReport,
  type DeptId,
  type Headcount,
  type HeatLevel,
  type StaffEntry,
} from '@/features/equipo/equipoAudit';

const STORE_KEY = 'hostel-equipo-v1';

interface Persisted {
  establishment: string;
  headcount: Headcount;
  entries: StaffEntry[];
}

function load(): Persisted {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return { establishment: '', headcount: {}, entries: [], ...(JSON.parse(raw) as Partial<Persisted>) };
  } catch {
    /* almacenamiento no disponible */
  }
  return { establishment: '', headcount: {}, entries: [] };
}

const HEAT_STYLE: Record<HeatLevel, string> = {
  ok: 'border-l-8 border-emerald-500',
  warn: 'border-l-8 border-amber-500',
  critical: 'border-l-8 border-red-500',
  none: 'border-l-8 border-border/20',
};

const Equipo: React.FC = () => {
  const [state, setState] = useState<Persisted>(load);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const { establishment, headcount, entries } = state;

  useEffect(() => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(state));
    } catch {
      /* ignorar */
    }
  }, [state]);

  const summary = useMemo(() => computeAudit(entries, headcount), [entries, headcount]);

  const onImport = async () => {
    if (!text.trim() || busy) return;
    setBusy(true);
    const r = await importCodes(text, entries);
    setState((s) => ({ ...s, entries: [...s.entries, ...r.entries] }));
    const parts = [`${r.entries.length} código(s) importado(s)`];
    if (r.duplicates) parts.push(`${r.duplicates} duplicado(s) ignorado(s)`);
    if (r.invalid.length) parts.push(`${r.invalid.length} inválido(s) rechazado(s)`);
    setStatus(parts.join(' · '));
    if (!r.invalid.length) setText('');
    setBusy(false);
  };

  const removeEntry = (code: string) => setState((s) => ({ ...s, entries: s.entries.filter((e) => e.code !== code) }));

  const exportReport = () => {
    const html = buildReportHtml(summary, establishment, new Date().toISOString().slice(0, 10));
    if (!printReport(html)) setStatus('El navegador bloqueó la ventana de impresión. Permite ventanas emergentes e inténtalo de nuevo.');
  };

  const field = 'w-full min-h-11 rounded-xl border border-border/30 bg-surface px-3 py-2 text-primary focus:ring-2 focus:ring-accent outline-none';

  return (
    <div className="p-4 sm:p-6 space-y-6" data-testid="equipo-page">
      <header>
        <h1 className="text-2xl sm:text-3xl font-black text-primary">Equipo · Auditoría de plantilla</h1>
        <p className="text-secondary mt-1">
          Modo Encargado: importa los códigos QR de certificación de tu equipo y audita su preparación para turistas internacionales.
        </p>
      </header>

      <div aria-live="polite" role="status" className="sr-only">{status}</div>

      {summary.alerts.map((a) => (
        <div key={a.dept} role="alert" data-testid="alerta-alergenos" className="rounded-2xl border-4 border-red-600 bg-surface p-4 text-error-text font-bold">
          <span aria-hidden="true">🚨 </span>Alerta roja · {a.message}
        </div>
      ))}

      <section aria-labelledby="eq-import" className="rounded-2xl border border-border/20 bg-surface p-4 space-y-3">
        <h2 id="eq-import" className="text-lg font-black text-primary">Plantilla y códigos de certificación</h2>
        <label className="block text-sm font-semibold text-secondary">
          Nombre del establecimiento
          <input className={`${field} mt-1`} value={establishment} onChange={(e) => setState((s) => ({ ...s, establishment: e.target.value }))} placeholder="Hotel Miramar" />
        </label>
        <fieldset>
          <legend className="text-sm font-semibold text-secondary mb-1">Personas en plantilla por departamento</legend>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {DEPARTMENTS.map((d) => (
              <label key={d.id} className="text-sm text-secondary">
                {d.label}
                <input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  className={field}
                  value={headcount[d.id] ?? ''}
                  onChange={(e) => {
                    const n = e.target.value === '' ? undefined : Math.max(0, parseInt(e.target.value, 10) || 0);
                    setState((s) => ({ ...s, headcount: { ...s.headcount, [d.id as DeptId]: n } }));
                  }}
                />
              </label>
            ))}
          </div>
        </fieldset>
        <label className="block text-sm font-semibold text-secondary">
          Pega los códigos (HE1.…), uno por línea
          <textarea className={`${field} mt-1 font-mono text-xs min-h-28`} value={text} onChange={(e) => setText(e.target.value)} placeholder="HE1.eyJ…" />
        </label>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onImport} disabled={busy || !text.trim()} className="min-h-11 px-4 rounded-xl bg-accent text-on-accent font-black disabled:opacity-60">
            {busy ? 'Verificando…' : 'Importar códigos'}
          </button>
          <button type="button" onClick={exportReport} className="min-h-11 px-4 rounded-xl border-2 border-accent text-primary font-black">
            Exportar Certificado de Calidad (PDF)
          </button>
        </div>
        <p className="text-sm text-secondary" data-testid="import-status">{status}</p>
      </section>

      <section aria-labelledby="eq-resumen" className="space-y-3">
        <h2 id="eq-resumen" className="text-lg font-black text-primary">Matriz de competencias</h2>
        <p className="text-secondary" data-testid="resumen-global">
          {summary.totalCertified}/{summary.totalStaff} certificados{summary.overallPct == null ? '' : ` (${summary.overallPct}%)`} · Nivel oral medio: {summary.avgLevel ?? '—'} · A2: {summary.levelCounts.A2} · B1: {summary.levelCounts.B1} · B2: {summary.levelCounts.B2}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {summary.depts.map((d) => (
            <article key={d.id} data-testid={`dept-${d.id}`} className="rounded-2xl border border-border/20 bg-surface p-4">
              <h3 className="font-black text-primary">{d.label}</h3>
              <p className="text-3xl font-black text-primary">{d.pct == null ? '—' : `${d.pct}%`}</p>
              <p className="text-sm text-secondary">{d.certified}/{d.headcount} certificados</p>
              <p className="text-sm text-secondary">Nivel oral: {d.level ?? '—'}</p>
              <div className="h-2 mt-2 rounded bg-border/20" aria-hidden="true">
                <div className="h-2 rounded bg-emerald-500" style={{ width: `${d.pct ?? 0}%` }} />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="eq-heat" className="space-y-2">
        <h2 id="eq-heat" className="text-lg font-black text-primary">Heatmap de áreas críticas</h2>
        <p className="text-sm text-secondary">Nota media de los certificados de cada departamento que cubre el área. Sólido ≥ 80 · Mejorable 70–79 · Crítico &lt; 70.</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[34rem] border-separate border-spacing-1 text-left" data-testid="heatmap">
            <thead>
              <tr>
                <th scope="col" className="p-2 text-secondary">Área</th>
                {DEPARTMENTS.map((d) => (
                  <th key={d.id} scope="col" className="p-2 text-secondary">{d.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {summary.areas.map((a) => (
                <tr key={a.id}>
                  <th scope="row" className="p-2 text-primary font-bold">{a.label}</th>
                  {a.cells.map((c) => (
                    <td key={c.dept} data-heat={c.relevant ? c.heat : 'na'} className={`p-2 rounded-lg bg-surface text-primary ${c.relevant ? HEAT_STYLE[c.heat] : ''}`}>
                      {!c.relevant ? <span className="text-secondary">n/a</span> : c.grade == null ? 'Sin datos' : <>{c.grade} · {HEAT_LABEL[c.heat]}</>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="sr-only">{AREAS.length} áreas críticas evaluadas.</p>
      </section>

      <section aria-labelledby="eq-lista" className="space-y-2">
        <h2 id="eq-lista" className="text-lg font-black text-primary">Personal importado ({entries.length})</h2>
        {entries.length === 0 ? (
          <p className="text-secondary">Aún no hay códigos importados.</p>
        ) : (
          <ul className="divide-y divide-border/20 rounded-2xl border border-border/20 bg-surface">
            {entries.map((e) => (
              <li key={e.code} className="flex items-center justify-between gap-2 p-3">
                <span className="text-primary">
                  <strong>{e.studentName}</strong> · {e.department} · {Math.round(e.grade)}/100 {e.dept ? '' : '(departamento no reconocido)'}
                </span>
                <button type="button" onClick={() => removeEntry(e.code)} aria-label={`Quitar a ${e.studentName}`} className="min-h-11 px-3 rounded-xl border border-border/30 text-primary">
                  Quitar
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default Equipo;
