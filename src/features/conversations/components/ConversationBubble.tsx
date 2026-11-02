import { useState } from 'react';
import { SpeakerWaveIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { ConversationTurn } from '@/store/useAppStore';

interface ConversationBubbleProps {
  turn: ConversationTurn;
  isMyTurn: boolean;
  isParticipant0: boolean;
  targetLanguage: string;
  onPlay: () => void;
  index: number;
  isFocusMode: boolean;
  onContinue?: () => void;
  canContinue?: boolean;
}

export default function ConversationBubble({
  turn,
  isMyTurn,
  isParticipant0,
  targetLanguage,
  onPlay,
  index,
  isFocusMode,
  onContinue,
  canContinue = true
}: ConversationBubbleProps) {
  const [hidden, setHidden] = useState(false);
  const showText = !isMyTurn || !hidden;
  const mainText = targetLanguage === 'eu' ? (turn.eu || '...') : turn.en;

  const alignClass = isParticipant0 ? 'items-start' : 'items-end';
  const bubbleClass = isMyTurn
    ? 'bg-accent/20 border-2 border-accent/40 rounded-br-none shadow-[0_0_20px_rgba(16,185,129,0.25)]'
    : (isParticipant0 ? 'bg-surface/10 rounded-bl-none' : 'bg-surface/10 rounded-br-none');

  const focusBubbleClass = isMyTurn
    ? 'bg-accent/20 border-accent/40 rounded-br-none p-6 sm:p-10 shadow-[0_0_30px_rgba(16,185,129,0.25)]'
    : 'bg-surface/10 border-border/10 p-6 sm:p-10';

  if (isFocusMode) {
    return (
      <div className="flex flex-col items-center w-full" aria-live="assertive">
        <div className={`w-full max-w-2xl rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl relative border-2 transition-all duration-500 ${focusBubbleClass}`}>
          {isMyTurn && (
            <div className="flex justify-center mb-5">
              <span
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent text-on-accent text-xs sm:text-sm font-black uppercase tracking-wider shadow-lg"
                role="status"
              >
                🎯 TU TURNO — DI EN VOZ ALTA
              </span>
            </div>
          )}
          <div className="flex items-center justify-center gap-4 mb-6">
            <span className={`text-xs font-black uppercase tracking-widest ${isMyTurn ? 'text-accent' : 'text-tertiary'}`}>
              {turn.speaker} {isMyTurn ? '(TÚ)' : ''}
            </span>
            {!isMyTurn && (
              <button
                onClick={onPlay}
                className="p-2 bg-surface/5 rounded-full text-accent hover:bg-accent hover:text-primary transition-all shadow-lg"
                aria-label="Reproducir audio"
              >
                <SpeakerWaveIcon className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="text-center space-y-4 sm:space-y-6">
            {showText ? (
              <>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-primary leading-tight break-words">{mainText}</h3>
                <p className="text-secondary text-base sm:text-lg md:text-xl font-medium leading-relaxed border-t border-border/5 pt-4 sm:pt-6 italic break-words">
                  {turn.es}
                </p>
              </>
            ) : (
              <p className="text-secondary italic py-6">Frase oculta. Pulsa «Mostrar» si necesitas ayuda.</p>
            )}
          </div>

          {isMyTurn && (
            <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
              <button
                onClick={onPlay}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-surface/10 border border-border/10 text-primary font-bold min-h-[44px]"
                aria-label="Escuchar cómo suena la frase"
              >
                <SpeakerWaveIcon className="w-5 h-5 text-accent" /> Escuchar
              </button>
              <button
                onClick={() => setHidden(h => !h)}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-surface/10 border border-border/10 text-primary font-bold min-h-[44px]"
                aria-pressed={hidden}
              >
                {hidden ? <EyeIcon className="w-5 h-5" /> : <EyeSlashIcon className="w-5 h-5" />}
                {hidden ? 'Mostrar' : 'Ocultar pista'}
              </button>
              {onContinue && (
                <button
                  onClick={onContinue}
                  disabled={!canContinue}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-accent text-on-accent font-black min-h-[44px] disabled:opacity-30"
                >
                  Continuar ▶
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col ${alignClass} animate-in slide-in-from-bottom-4 duration-500 w-full`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className={`max-w-[95%] md:max-w-[85%] rounded-[2rem] p-6 shadow-xl relative group border border-border/5 ${bubbleClass}`}>
        {isMyTurn && (
          <span
            className="inline-flex items-center gap-1 mb-2 px-3 py-1 rounded-full bg-accent text-on-accent text-[10px] font-black uppercase tracking-wider"
            role="status"
          >
            🎤 TU TURNO DE HABLAR
          </span>
        )}
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-[10px] font-black uppercase tracking-widest ${isMyTurn ? 'text-accent' : 'text-tertiary'}`}>
            {turn.speaker} {isMyTurn ? '(TÚ)' : ''}
          </span>
          <button
            onClick={onPlay}
            className={`p-1 text-tertiary hover:text-primary transition-all ${isMyTurn ? '' : 'opacity-0 group-hover:opacity-100 focus:opacity-100'}`}
            aria-label={`Reproducir frase de ${turn.speaker}`}
          >
            <SpeakerWaveIcon className="w-4 h-4" />
          </button>
        </div>

        <p className="text-lg font-bold text-primary mb-2 leading-tight break-words">{mainText}</p>
        <p className="text-tertiary text-sm font-medium leading-relaxed border-t border-border/5 pt-2 mt-2 italic break-words">{turn.es}</p>
      </div>
    </div>
  );
}
