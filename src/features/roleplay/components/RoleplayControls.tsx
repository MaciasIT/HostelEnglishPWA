import { useState } from 'react';
import { MicrophoneIcon, StopIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';

interface RoleplayControlsProps {
  isListening: boolean;
  asrSupported: boolean;
  disabled?: boolean;
  onToggleListening: () => void;
  onSubmitText: (text: string) => void;
}

/**
 * Controles de entrada: botón de voz (ASR) + campo de texto como fallback
 * accesible para teclado y para navegadores sin API de reconocimiento.
 */
export default function RoleplayControls({
  isListening,
  asrSupported,
  disabled = false,
  onToggleListening,
  onSubmitText,
}: RoleplayControlsProps) {
  const [draft, setDraft] = useState('');

  const submit = () => {
    const text = draft.trim();
    if (!text) return;
    onSubmitText(text);
    setDraft('');
  };

  return (
    <div className="space-y-3">
      {!asrSupported && (
        <p className="text-tertiary text-xs text-center" role="status">
          Tu navegador no soporta reconocimiento de voz; usa el teclado.
        </p>
      )}

      <div className="flex items-center gap-3">
        {asrSupported && (
          <button
            onClick={onToggleListening}
            disabled={disabled}
            aria-label={isListening ? 'Detener grabación' : 'Hablar ahora'}
            aria-pressed={isListening}
            className={`p-4 rounded-2xl transition-all active:scale-95 disabled:opacity-40 shrink-0 ${
              isListening
                ? 'bg-error text-primary animate-pulse'
                : 'bg-accent text-on-accent hover:brightness-110'
            }`}
          >
            {isListening ? (
              <StopIcon className="w-6 h-6" aria-hidden="true" />
            ) : (
              <MicrophoneIcon className="w-6 h-6" aria-hidden="true" />
            )}
          </button>
        )}

        <div className="flex-grow flex items-center gap-2 bg-surface border border-border/15 rounded-2xl px-4 py-2">
          <input
            type="text"
            value={draft}
            disabled={disabled}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="Escribe tu respuesta en inglés…"
            aria-label="Respuesta del alumno"
            className="flex-grow bg-transparent outline-none text-primary placeholder:text-tertiary text-sm"
          />
          <button
            onClick={submit}
            disabled={disabled || !draft.trim()}
            aria-label="Enviar respuesta"
            className="p-2 rounded-xl text-accent hover:bg-surface/10 disabled:opacity-40 transition-colors"
          >
            <PaperAirplaneIcon className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}