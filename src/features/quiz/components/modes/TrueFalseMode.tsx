import React from 'react';
import { Question, Feedback } from '../../types';

interface TrueFalseModeProps {
  currentQuestion: Question;
  feedback: Feedback | null;
  onAnswer: (answer: boolean) => void;
}

const TrueFalseMode: React.FC<TrueFalseModeProps> = ({ 
  currentQuestion, 
  feedback, 
  onAnswer 
}) => {
  return (
    <div className="space-y-10">
      <div className="p-8 bg-white/5 rounded-3xl border border-white/10 text-center shadow-inner">
        <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">Traducción propuesta:</p>
        <p className="text-3xl font-black text-white italic">"{currentQuestion.tfTranslation}"</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <button
          onClick={() => onAnswer(true)}
          className={`p-8 rounded-3xl font-black text-2xl transition-all border-2 shadow-lg ${feedback && currentQuestion.tfIsCorrect ? 'bg-green-500 border-green-400 scale-105' :
            feedback && !currentQuestion.tfIsCorrect ? 'bg-gray-800 border-white/10 opacity-30' :
              'bg-blue-600 border-blue-500 hover:brightness-110 active:scale-95'
            }`}
          disabled={!!feedback}
        >
          SÍ
        </button>
        <button
          onClick={() => onAnswer(false)}
          className={`p-8 rounded-3xl font-black text-2xl transition-all border-2 shadow-lg ${feedback && !currentQuestion.tfIsCorrect ? 'bg-green-500 border-green-400 scale-105' :
            feedback && currentQuestion.tfIsCorrect ? 'bg-gray-800 border-white/10 opacity-30' :
              'bg-red-600 border-red-500 hover:brightness-110 active:scale-95'
            }`}
          disabled={!!feedback}
        >
          NO
        </button>
      </div>
    </div>
  );
};

export default TrueFalseMode;
