import React from 'react';
import { SpeakerWaveIcon } from '@heroicons/react/24/outline';
import { ConversationTurn } from '@/store/useAppStore';

interface ConversationBubbleProps {
  turn: ConversationTurn;
  isMyTurn: boolean;
  isParticipant0: boolean;
  targetLanguage: string;
  onPlay: () => void;
  index: number;
  isFocusMode: boolean;
}

export default function ConversationBubble({
  turn,
  isMyTurn,
  isParticipant0,
  targetLanguage,
  onPlay,
  index,
  isFocusMode
}: ConversationBubbleProps) {
  const alignClass = isParticipant0 ? 'items-start' : 'items-end';
  const bubbleClass = isMyTurn
    ? 'bg-accent/20 border-2 border-accent/40 rounded-br-none'
    : (isParticipant0 ? 'bg-white/10 rounded-bl-none' : 'bg-primary-light/10 rounded-br-none');

  const focusBubbleClass = isMyTurn
    ? 'bg-accent/20 border-2 border-accent/40 rounded-br-none p-10'
    : (isParticipant0 ? 'bg-white/10 border-white/10 p-10' : 'bg-primary-light/10 border-white/10 p-10');

  if (isFocusMode) {
    return (
      <div 
        className={`flex flex-col items-center w-full`}
        aria-live="assertive"
      >
        <div className={`w-full max-w-2xl rounded-[2.5rem] shadow-2xl relative border-2 transition-all duration-500 ${focusBubbleClass}`}>
          <div className="flex items-center justify-center gap-4 mb-6">
            <span className={`text-xs font-black uppercase tracking-widest ${isMyTurn ? 'text-accent' : 'text-gray-500'}`}>
              {turn.speaker} {isMyTurn ? '(TÚ)' : ''}
            </span>
            {!isMyTurn && (
              <button
                onClick={onPlay}
                className="p-2 bg-white/5 rounded-full text-accent hover:bg-accent hover:text-white transition-all shadow-lg"
                aria-label="Reproducir audio"
              >
                <SpeakerWaveIcon className="w-5 h-5" />
              </button>
            )}
          </div>

          {isMyTurn ? (
            <div className="py-8 px-6 bg-accent border border-accent rounded-3xl text-center shadow-lg animate-pulse" role="alert">
              <p className="text-xl text-white font-black uppercase tracking-tighter">¡ES TU TURNO!</p>
              <p className="text-white/80 text-sm mt-2 font-medium">Practica tu pronunciación ahora</p>
            </div>
          ) : (
            <div className="text-center space-y-6">
              <h3 className="text-2xl md:text-3xl font-black text-white leading-tight">
                {targetLanguage === 'eu' ? (turn.eu || '...') : turn.en}
              </h3>
              <p className="text-gray-300 text-lg md:text-xl font-medium leading-relaxed border-t border-white/5 pt-6 italic">
                {turn.es}
              </p>
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
      <div className={`max-w-[95%] md:max-w-[85%] rounded-[2rem] p-6 shadow-xl relative group border border-white/5 ${bubbleClass}`}>
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-[10px] font-black uppercase tracking-widest ${isMyTurn ? 'text-accent' : 'text-gray-500'}`}>
            {turn.speaker} {isMyTurn ? '(TÚ)' : ''}
          </span>
          {!isMyTurn && (
            <button
              onClick={onPlay}
              className="p-1 text-gray-400 hover:text-white transition-all opacity-0 group-hover:opacity-100"
              aria-label={`Reproducir frase de ${turn.speaker}`}
            >
              <SpeakerWaveIcon className="w-4 h-4" />
            </button>
          )}
        </div>

        {isMyTurn ? (
          <div className="py-4 px-6 bg-accent border border-accent rounded-2xl text-center" role="alert">
            <p className="text-white font-black text-xs uppercase tracking-widest">¡TU TURNO!</p>
          </div>
        ) : (
          <>
            <p className="text-lg font-bold text-white mb-2 leading-tight">
              {targetLanguage === 'eu' ? (turn.eu || '...') : turn.en}
            </p>
            <p className="text-gray-400 text-sm font-medium leading-relaxed border-t border-white/5 pt-2 mt-2 italic">{turn.es}</p>
          </>
        )}
      </div>
    </div>
  );
}
