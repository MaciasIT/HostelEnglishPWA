import { CheckBadgeIcon, FaceFrownIcon } from '@heroicons/react/24/outline';
import { COURTESY_LEVEL_LABELS } from '../courtesyEvaluator';
import type { FeedbackSummary } from '../feedbackSummary';

interface RoleplayFeedbackCardProps {
  summary: FeedbackSummary;
}

/**
 * Tarjeta de resumen de feedback (FC-04) al terminar el escenario: puntuación
 * de cortesía, vocabulario técnico utilizado y áreas de mejora.
 */
export default function RoleplayFeedbackCard({ summary }: RoleplayFeedbackCardProps) {
  const pct = summary.politenessScore;

  return (
    <div className="bg-surface/5 backdrop-blur-xl border border-border/15 rounded-[2rem] p-6 text-left space-y-5">
      {/* Cabecera de cortesía */}
      <div className="flex items-center gap-4">
        {summary.politenessScore >= 55 ? (
          <CheckBadgeIcon className="w-10 h-10 text-success shrink-0" aria-hidden="true" />
        ) : (
          <FaceFrownIcon className="w-10 h-10 text-tertiary shrink-0" aria-hidden="true" />
        )}
        <div className="flex-grow min-w-0">
          <p className="text-xs uppercase tracking-widest text-secondary font-bold">
            Cortesía · {COURTESY_LEVEL_LABELS[summary.politenessLevel]}
          </p>
          <div className="flex items-center gap-3 mt-1">
            <div
              className="flex-grow h-2.5 bg-surface rounded-full overflow-hidden border border-border/10"
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Puntuación de cortesía"
            >
              <div
                className="h-full bg-accent transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-primary font-black text-lg tabular-nums">{pct}/100</span>
          </div>
        </div>
      </div>

      {/* Vocabulario técnico */}
      <div>
        <p className="text-xs uppercase tracking-widest text-secondary font-bold mb-2">
          Vocabulario técnico utilizado
        </p>
        {summary.technicalVocabularyUsed.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {summary.technicalVocabularyUsed.map((term) => (
              <span
                key={term}
                className="bg-success/15 text-success text-xs font-bold px-3 py-1 rounded-full border border-success/20"
              >
                {term}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-tertiary text-sm italic">
            Aún no has usado vocabulario técnico del sector.
          </p>
        )}
      </div>

      {/* Áreas de mejora */}
      {summary.areasToImprove.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-widest text-secondary font-bold mb-2">
            Áreas de mejora
          </p>
          <ul className="space-y-1.5">
            {summary.areasToImprove.map((area, idx) => (
              <li key={idx} className="text-sm text-tertiary flex gap-2">
                <span className="text-accent-text font-black shrink-0">→</span>
                <span>{area}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Puntos fuertes */}
      {summary.strengths.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-widest text-success font-bold mb-2">
            Lo que hiciste bien
          </p>
          <ul className="space-y-1.5">
            {summary.strengths.map((strength, idx) => (
              <li key={idx} className="text-sm text-tertiary flex gap-2">
                <span className="text-success font-black shrink-0">✓</span>
                <span>{strength}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}