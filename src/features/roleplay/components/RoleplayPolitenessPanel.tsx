import type { PolitenessEvaluation, PolitenessLevel } from '@/services/ai';
import { POLITENESS_LEVEL_LABELS } from '@/services/ai';

interface RoleplayPolitenessPanelProps {
  evaluation: PolitenessEvaluation;
}

/**
 * Colorimetría accesible: cada nivel combina color, icono y etiqueta textual,
 * de modo que la información nunca depende solo del color (WCAG 1.4.1).
 */
const LEVEL_STYLE: Record<PolitenessLevel, { icon: string; bar: string; text: string }> = {
  excelente: { icon: '✅', bar: 'bg-success', text: 'text-success' },
  buena: { icon: '👍', bar: 'bg-accent', text: 'text-accent-text' },
  mejorable: { icon: '⚠️', bar: 'bg-yellow-500', text: 'text-warning-text' },
  descortés: { icon: '⛔', bar: 'bg-error', text: 'text-error' },
};

/**
 * Panel «Hospitality Politeness Feedback»: termómetro 0–100 de cortesía
 * profesional, comentario y frase sugerida más diplomática (FD-04).
 */
export default function RoleplayPolitenessPanel({ evaluation }: RoleplayPolitenessPanelProps) {
  const style = LEVEL_STYLE[evaluation.level];
  const label = POLITENESS_LEVEL_LABELS[evaluation.level];
  const score = Math.round(evaluation.politenessScore);

  return (
    <section
      className="rounded-2xl border border-border/15 bg-surface/5 p-4 text-left"
      aria-label="Hospitality Politeness Feedback"
      data-testid="politeness-panel"
    >
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-[10px] uppercase tracking-widest font-black text-tertiary">
          Hospitality Politeness Feedback
        </h4>
        <span className={`text-sm font-black ${style.text}`}>
          <span aria-hidden="true">{style.icon} </span>
          {label} · {score}/100
        </span>
      </div>
      <div
        className="w-full h-3 bg-surface/10 rounded-full overflow-hidden border border-border/10"
        role="meter"
        aria-label="Termómetro de cortesía profesional"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext={`${label}, ${score} de 100`}
      >
        <div className={`h-full ${style.bar} transition-all duration-500`} style={{ width: `${score}%` }} />
      </div>
      <p className="text-xs text-secondary mt-2">{evaluation.hospitalityFeedback}</p>
      {evaluation.suggestedBetterPhrase && (
        <p className="text-sm text-primary mt-2" data-testid="politeness-suggestion">
          <span className="text-tertiary">Prueba: </span>
          <span className="font-semibold">“{evaluation.suggestedBetterPhrase}”</span>
        </p>
      )}
    </section>
  );
}
