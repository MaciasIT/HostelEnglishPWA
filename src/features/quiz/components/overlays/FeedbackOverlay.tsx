import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Feedback, Question } from '../../types';

interface FeedbackOverlayProps {
  feedback: Feedback | null;
  currentQuestion: Question | null;
  streak: number;
  targetLanguage: string;
  lives: number;
  questionsHandled: number;
  totalInLevel: number;
  onContinue: () => void;
}

const FeedbackOverlay: React.FC<FeedbackOverlayProps> = ({
  feedback,
  currentQuestion,
  streak,
  targetLanguage,
  lives,
  questionsHandled,
  totalInLevel,
  onContinue
}) => {
  if (!feedback || !currentQuestion) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-primary-dark/80 backdrop-blur-md"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          className={`max-w-md w-full p-8 rounded-[2.5rem] text-center shadow-2xl border-2 ${feedback.isCorrect ? 'bg-green-600 border-green-400' : 'bg-red-600 border-red-400'}`}
        >
          <div className="mb-4">
            {feedback.isCorrect ? (
              <CheckCircleIcon className="w-16 h-16 text-white mx-auto animate-bounce" />
            ) : (
              <XMarkIcon className="w-16 h-16 text-white mx-auto" />
            )}
          </div>
          <p className="text-2xl font-black mb-2">{feedback.isCorrect ? '¡MUY BIEN!' : '¡OUCH!'}</p>
          <p className="text-lg opacity-90 mb-8 font-medium italic">
            {feedback.isCorrect 
              ? (streak > 2 ? `¡Racha de ${streak} aciertos! 🔥` : '¡Sigue así!') 
              : `La respuesta correcta era: ${targetLanguage === 'eu' ? currentQuestion.target.eu : currentQuestion.target.en}`
            }
          </p>
          <button
            onClick={onContinue}
            className="bg-white text-primary-dark font-black py-4 px-12 rounded-2xl hover:bg-black hover:text-white transition-all shadow-2xl active:scale-95 w-full uppercase tracking-widest"
          >
            {lives <= 0 ? 'Ver Resultados' : (questionsHandled >= totalInLevel ? 'Ver Victoria' : 'Continuar')}
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FeedbackOverlay;
