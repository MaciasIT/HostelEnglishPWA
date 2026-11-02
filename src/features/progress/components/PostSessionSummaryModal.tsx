import { useEffect, useRef } from 'react';
import type { FluencyReport } from '../lib/fluency';

export interface WeakPhrase {
  id: string;
  text: string;
}

export interface PostSessionSummaryModalProps {
  open: boolean;
  onClose: () => void;
  xpEarned: number;
  streak: number;
  fluency: FluencyReport;
  weakPhrases: WeakPhrase[];
  onDownloadDiploma?: () => void;
}

function Bar({ label, value }: { label: string; value: number | null }) {
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span>{value === null ? 'Sin datos' : `${value}%`}</span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value ?? 0}
        className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden"
      >
        <div className="h-full bg-indigo-500" style={{ width: `${value ?? 0}%` }} />
      </div>
    </div>
  );
}

export default function PostSessionSummaryModal({
  open,
  onClose,
  xpEarned,
  streak,
  fluency,
  weakPhrases,
  onDownloadDiploma,
}: PostSessionSummaryModalProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="post-session-title"
        className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-gray-900 p-6 space-y-5 shadow-xl"
      >
        <h2 id="post-session-title" className="text-xl font-bold">
          Resumen de la sesión
        </h2>

        <div className="text-center">
          <div className="text-5xl font-extrabold text-indigo-600" data-testid="fluency-score">
            {fluency.score}
          </div>
          <div className="text-sm text-tertiary">Fluidez laboral · nivel {fluency.level}</div>
        </div>

        <div className="space-y-3">
          <Bar label="Velocidad de respuesta" value={fluency.speedScore} />
          <Bar label="Precisión fonética" value={fluency.accuracyScore} />
          <Bar label="Resolución en roleplays" value={fluency.roleplayScore} />
        </div>

        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="rounded-xl bg-amber-500/10 p-3">
            <div className="text-2xl font-bold" data-testid="xp-earned">+{xpEarned} XP</div>
            <div className="text-xs text-tertiary">XP ganada</div>
          </div>
          <div className="rounded-xl bg-orange-500/10 p-3">
            <div className="text-2xl font-bold" data-testid="streak">🔥 {streak}</div>
            <div className="text-xs text-tertiary">Racha (días)</div>
          </div>
        </div>

        <section aria-label="Frases para reforzar">
          <h3 className="font-semibold mb-2">Frases para reforzar</h3>
          {weakPhrases.length === 0 ? (
            <p className="text-sm text-tertiary">¡Nada que reforzar hoy!</p>
          ) : (
            <ul className="list-disc pl-5 text-sm space-y-1">
              {weakPhrases.map((p) => (
                <li key={p.id}>{p.text}</li>
              ))}
            </ul>
          )}
        </section>

        <div className="flex gap-2">
          {onDownloadDiploma && (
            <button
              type="button"
              onClick={onDownloadDiploma}
              className="flex-1 rounded-xl border border-indigo-500 text-indigo-600 py-2 font-medium"
            >
              Descargar diploma
            </button>
          )}
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl bg-indigo-600 text-white py-2 font-medium"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
