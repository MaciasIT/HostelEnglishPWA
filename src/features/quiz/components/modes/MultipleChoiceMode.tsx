import React from 'react';
import { Question, Feedback } from '../../types';

interface MultipleChoiceModeProps {
  currentQuestion: Question;
  feedback: Feedback | null;
  targetLanguage: string;
  onAnswer: (answer: string) => void;
}

const MultipleChoiceMode: React.FC<MultipleChoiceModeProps> = ({ 
  currentQuestion, 
  feedback, 
  targetLanguage, 
  onAnswer 
}) => {
  const targetText = (targetLanguage === 'eu' ? currentQuestion.target.eu : currentQuestion.target.en) || currentQuestion.target.en;

  return (
    <div className="grid grid-cols-1 gap-4">
      {currentQuestion.options.map((option, idx) => (
        <button
          key={idx}
          onClick={() => onAnswer(option)}
          className={`p-5 text-left rounded-2xl transition-all duration-300 border-2 flex items-center ${feedback
            ? (option === targetText
              ? 'bg-green-500 border-green-400 scale-[1.02] shadow-xl z-20'
              : (feedback.isCorrect ? 'bg-white/5 border-white/10 opacity-30 scale-95' : 'bg-red-500 border-red-400'))
            : 'bg-white/5 border-white/10 hover:bg-white/20 hover:border-accent active:scale-98'
            } text-white text-base font-bold`}
          disabled={!!feedback}
        >
          <span className="w-8 h-8 rounded-xl bg-white/10 text-center leading-8 mr-4 text-xs font-black border border-white/20">
            {String.fromCharCode(65 + idx)}
          </span>
          {option}
        </button>
      ))}
    </div>
  );
};

export default MultipleChoiceMode;
