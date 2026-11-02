import { useMemo, useState } from 'react';
import {
  CANONICAL_ROLEPLAY_SCENARIOS,
  ROLEPLAY_DEPARTMENT_LABELS,
  resolveScenarioMeta,
} from '../scenarios';
import { filterScenarios, groupByDepartment } from '../catalog';
import type { RoleplayDepartment, RoleplayScenario } from '../schema';

interface RoleplayScenarioPickerProps {
  onSelect: (scenario: RoleplayScenario) => void;
  /** Catálogo a mostrar; por defecto los escenarios canónicos. */
  scenarios?: RoleplayScenario[];
}

/**
 * Selector de escenarios agrupados por departamento con filtro rápido
 * (chips por departamento + búsqueda de texto).
 */
export default function RoleplayScenarioPicker({
  onSelect,
  scenarios = CANONICAL_ROLEPLAY_SCENARIOS,
}: RoleplayScenarioPickerProps) {
  const [department, setDepartment] = useState<RoleplayDepartment | 'all'>('all');
  const [query, setQuery] = useState('');

  const groups = useMemo(
    () => groupByDepartment(filterScenarios(scenarios, department, query)),
    [scenarios, department, query],
  );
  const departments = useMemo(() => [...groupByDepartment(scenarios).keys()], [scenarios]);

  const chipClass = (active: boolean) =>
    `min-h-11 inline-flex items-center justify-center px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest border transition-colors ${
      active
        ? 'bg-accent text-on-accent border-accent'
        : 'bg-surface/5 text-tertiary border-border/15 hover:bg-surface/10'
    }`;

  return (
    <div aria-label="Escenarios de roleplay" className="space-y-6">
      <div className="space-y-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar escenario…"
          aria-label="Buscar escenario"
          className="w-full bg-surface/5 border border-border/15 rounded-2xl px-4 py-3 text-primary placeholder:text-tertiary focus:outline-none focus:border-accent"
        />
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por departamento">
          <button
            type="button"
            aria-pressed={department === 'all'}
            onClick={() => setDepartment('all')}
            className={chipClass(department === 'all')}
          >
            Todos ({scenarios.length})
          </button>
          {departments.map((dep) => (
            <button
              key={dep}
              type="button"
              aria-pressed={department === dep}
              onClick={() => setDepartment(dep)}
              className={chipClass(department === dep)}
            >
              {ROLEPLAY_DEPARTMENT_LABELS[dep]}
            </button>
          ))}
        </div>
      </div>

      {groups.size === 0 && (
        <p className="text-center text-tertiary" role="status">
          Ningún escenario coincide con el filtro.
        </p>
      )}

      {[...groups.entries()].map(([dep, items]) => (
        <section key={dep} aria-label={ROLEPLAY_DEPARTMENT_LABELS[dep]}>
          <h2 className="text-xs font-black uppercase tracking-widest text-secondary mb-3">
            {ROLEPLAY_DEPARTMENT_LABELS[dep]} · {items.length}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {items.map((scenario) => {
              const meta = resolveScenarioMeta(scenario.key);
              return (
                <button
                  key={scenario.key}
                  onClick={() => onSelect(scenario)}
                  className="text-left bg-surface/5 backdrop-blur-xl p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-border/15 hover:bg-surface/10 hover:-translate-y-1 transition-all shadow-xl group"
                >
                  <span className="inline-block bg-accent/20 text-accent-text text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-3">
                    {ROLEPLAY_DEPARTMENT_LABELS[scenario.department]}
                  </span>
                  <h3 className="text-lg font-black text-primary mb-2 group-hover:text-accent-text transition-colors">
                    {meta.title}
                  </h3>
                  <p className="text-tertiary text-sm leading-relaxed">{scenario.objective}</p>
                  <p className="mt-4 text-xs font-bold uppercase tracking-widest text-secondary">
                    {scenario.targetTurns.min}–{scenario.targetTurns.max} turnos · Inglés{' '}
                    {scenario.level}
                  </p>
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
