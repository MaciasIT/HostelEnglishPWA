import {
  CANONICAL_ROLEPLAY_SCENARIOS,
  ROLEPLAY_DEPARTMENT_LABELS,
  resolveScenarioMeta,
} from '../scenarios';
import type { RoleplayScenario } from '../schema';

interface RoleplayScenarioPickerProps {
  onSelect: (scenario: RoleplayScenario) => void;
}

/**
 * Catálogo de los 5 escenarios canónicos. Cada tarjeta muestra departamento,
 * título y objetivo del alumno.
 */
export default function RoleplayScenarioPicker({ onSelect }: RoleplayScenarioPickerProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6" aria-label="Escenarios de roleplay">
      {CANONICAL_ROLEPLAY_SCENARIOS.map((scenario) => {
        const meta = resolveScenarioMeta(scenario.key);
        return (
          <button
            key={scenario.key}
            onClick={() => onSelect(scenario)}
            className="text-left bg-surface/5 backdrop-blur-xl p-6 rounded-3xl border border-border/15 hover:bg-surface/10 hover:-translate-y-1 transition-all shadow-xl group"
          >
            <span className="inline-block bg-accent/20 text-accent text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-3">
              {ROLEPLAY_DEPARTMENT_LABELS[scenario.department]}
            </span>
            <h3 className="text-lg font-black text-primary mb-2 group-hover:text-accent transition-colors">
              {meta.title}
            </h3>
            <p className="text-tertiary text-sm leading-relaxed">{scenario.objective}</p>
            <p className="mt-4 text-xs font-bold uppercase tracking-widest text-secondary">
              {scenario.targetTurns.min}–{scenario.targetTurns.max} turnos · Inglés {scenario.level}
            </p>
          </button>
        );
      })}
    </div>
  );
}