import { useState } from 'react';
import { LightBulbIcon, XMarkIcon } from '@heroicons/react/24/outline';
import type { RoleplayHint as RoleplayHintData } from '../hintService';

interface RoleplayHintProps {
  hint: RoleplayHintData;
  onDismiss: () => void;
}

/**
 * Pista situacional discreta (FC-04). Aparece como botón sutil "Pista" y, al
 * pulsarlo, despliega una frase de ejemplo y palabras clave. No interrumpe: el
 * alumno decide si la usa o la descarta.
 */
export default function RoleplayHint({ hint, onDismiss }: RoleplayHintProps) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="rounded-2xl border border-accent/25 bg-accent/10 p-3"
      role="region"
      aria-label="Pista opcional"
    >
      <div className="flex items-center gap-2">
        <button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex items-center gap-2 text-accent font-bold text-sm hover:brightness-110 transition-all px-2 py-1 rounded-xl"
        >
          <LightBulbIcon className="w-5 h-5" aria-hidden="true" />
          {open ? 'Ocultar pista' : '¿Necesitas una pista?'}
        </button>
        <button
          onClick={onDismiss}
          aria-label="Descartar pista"
          className="ml-auto p-1 rounded-lg text-tertiary hover:text-primary hover:bg-surface/10 transition-colors"
        >
          <XMarkIcon className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      {open && (
        <div className="mt-2 space-y-2 animate-fade-in">
          <p className="text-sm text-primary italic">“{hint.phrase}”</p>
          {hint.keywords.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {hint.keywords.map((word) => (
                <span
                  key={word}
                  className="bg-accent/15 text-accent text-xs font-bold px-2 py-1 rounded-full"
                >
                  {word}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}