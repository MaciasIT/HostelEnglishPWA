import React from 'react';
import { Question, Feedback, ScrambledWord } from '../../types';

interface ScrambleModeProps {
  currentQuestion: Question;
  feedback: Feedback | null;
  scrambleAnswers: ScrambledWord[];
  onAnswer: (answer: string) => void;
  onSelectWord: (word: ScrambledWord) => void;
  onRemoveWord: (word: ScrambledWord) => void;
  onReset: () => void;
}

const ScrambleMode: React.FC<ScrambleModeProps> = ({
  currentQuestion,
  feedback,
  scrambleAnswers,
  onAnswer,
  onSelectWord,
  onRemoveWord,
  onReset
}) => {
  return (
    <div className="space-y-8">
      {/* Answers Zone */}
      <div className="min-h-[120px] p-8 bg-black/20 rounded-3xl border-2 border-dashed border-white/10 flex flex-wrap gap-3 shadow-inner">
        {scrambleAnswers.map((word) => (
          <button
            key={word.id}
            onClick={() => onRemoveWord(word)}
            className="px-5 py-3 bg-accent rounded-xl font-black text-white shadow-xl animate-in zoom-in-50 hover:bg-red-500 transition-colors"
            disabled={!!feedback}
          >
            {word.text}
          </button>
        ))}
        {scrambleAnswers.length === 0 && <p className="text-gray-600 italic text-center w-full mt-4">Toca las palabras para construir la frase</p>}
      </div>

      {/* Source Zone */}
      <div className="flex flex-wrap gap-3 justify-center pt-6">
        {currentQuestion.scrambledWords?.map((word) => {
          const isUsed = scrambleAnswers.some(w => w.id === word.id);

          return (
            <button
              key={word.id}
              onClick={() => onSelectWord(word)}
              className={`px-5 py-3 bg-white/10 border border-white/10 rounded-xl font-black text-white hover:bg-white/20 active:scale-90 transition-all shadow-md ${isUsed ? 'opacity-0 scale-0 pointer-events-none' : ''}`}
              disabled={!!feedback}
            >
              {word.text}
            </button>
          );
        })}
      </div>

      <div className="pt-8 flex flex-col items-center gap-4">
        <button
          onClick={() => onAnswer(scrambleAnswers.map(w => w.text).join(' '))}
          className={`px-12 py-4 bg-accent rounded-2xl font-black uppercase tracking-widest shadow-2xl transition-all hover:scale-105 active:scale-95 ${scrambleAnswers.length === 0 || !!feedback ? 'opacity-50 pointer-events-none' : ''}`}
        >
          Comprobar
        </button>
        <button
          onClick={onReset}
          className="text-xs text-gray-500 hover:text-white uppercase tracking-widest font-black transition-all"
          disabled={!!feedback}
        >
          Resetear frase
        </button>
      </div>
    </div>
  );
};

export default ScrambleMode;
