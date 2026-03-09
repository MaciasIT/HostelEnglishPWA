import React from 'react';
import { motion } from 'framer-motion';
import { Question, Feedback } from '../../types';

interface MultipleChoiceModeProps {
  currentQuestion: Question;
  feedback: Feedback | null;
  targetLanguage: string;
  onAnswer: (answer: string) => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 10 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 20 }
  },
} as const;

const MultipleChoiceMode: React.FC<MultipleChoiceModeProps> = ({ 
  currentQuestion, 
  feedback, 
  targetLanguage, 
  onAnswer 
}) => {
  const targetText = (targetLanguage === 'eu' ? currentQuestion.target.eu : currentQuestion.target.en) || currentQuestion.target.en;

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 gap-4"
    >
      {currentQuestion.options.map((option, idx) => (
        <motion.button
          key={idx + currentQuestion.id}
          variants={itemVariants}
          layout
          onClick={() => onAnswer(option)}
          className={`p-5 text-left rounded-[1.5rem] transition-all duration-300 border-2 flex items-center shadow-lg relative overflow-hidden group ${feedback
            ? (option === targetText
              ? 'bg-green-600 border-green-400 scale-[1.02] shadow-[0_0_20px_rgba(34,197,94,0.4)] z-10'
              : (feedback.isCorrect ? 'bg-white/5 border-white/10 opacity-30 scale-95' : 'bg-red-600 border-red-400'))
            : 'bg-white/5 border-white/10 hover:bg-white/20 hover:border-accent active:scale-[0.98]'
            } text-white text-base font-bold`}
          disabled={!!feedback}
        >
          {/* Subtle glow on hover */}
          {!feedback && (
            <div className="absolute inset-0 bg-accent/0 group-hover:bg-accent/5 transition-colors" />
          )}

          <span className={`w-8 h-8 rounded-xl flex items-center justify-center mr-4 text-xs font-black border transition-colors ${
            feedback && option === targetText 
              ? 'bg-white/20 border-white/40 text-white' 
              : 'bg-white/10 border-white/20 text-gray-300'
          }`}>
            {String.fromCharCode(65 + idx)}
          </span>
          <span className="relative z-10">{option}</span>
        </motion.button>
      ))}
    </motion.div>
  );
};

export default MultipleChoiceMode;
