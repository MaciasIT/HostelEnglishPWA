import { useState } from 'react';
import { SparklesIcon, XMarkIcon } from '@heroicons/react/24/outline';
import type { CourtesyEvaluation } from '../courtesyEvaluator';

interface RoleplayCorrectionProps {
  feedback: CourtesyEvaluation;
}

/**
 * Corrección de cortesía post-turno (FC-04). Muestra de forma no intrusiva una
 * mejora sugerida (p. ej. «Could you please…?» en vez de «Give me…») y la
 * explicación en español, sin bloquear la conversación.
 */
export default function RoleplayCorrection({ feedback }: RoleplayCorrectionProps) {
  const [open, setOpen] = useState(true);

  if (feedback.issues.length === 0) return null;

  const first = feedback.issues[0];

  return (
    <div
      className="rounded-2xl border border-secondary/20 bg-surface/5 p-3"
      role="status"
      aria-label="Sugerencia de mejora"
    >
      <div className="flex items-center gap-2">
        <SparklesIcon className="w-5 h-5 text-secondary shrink-0" aria-hidden="true" />
        <p className="text-sm text-secondary flex-grow">
          {open ? (
            <>
              Una mejora: <span className="text-primary font-semibold">“{first.suggestion}”</span>{' '}
              en vez de “{first.label}”.
            </>
          ) : (
            <span className="font-bold">¿Quieres ver la sugerencia?</span>
          )}
        </p>
        <button
          onClick={() => setOpen((v) => !v)}
          className="text-xs text-accent font-bold hover:brightness-110 px-2 py-1 rounded-lg transition-colors"
          aria-expanded={open}
        >
          {open ? 'Ocultar' : 'Ver'}
        </button>
        <button
          onClick={() => setOpen(false)}
          aria-label="Descartar sugerencia"
          className="p-1 rounded-lg text-tertiary hover:text-primary hover:bg-surface/10 transition-colors"
        >
          <XMarkIcon className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
      {open && <p className="text-xs text-tertiary mt-1">{first.message}</p>}
    </div>
  );
}