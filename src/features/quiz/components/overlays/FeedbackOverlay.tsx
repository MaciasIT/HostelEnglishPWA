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
          className={`max-w-md w-full p-8 rounded-[2.5rem] text-center shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-2 ${feedback.isCorrect ? 'correct-gradient border-white/30' : 'error-gradient border-white/30'}`}
        >
          <div className="mb-4">
            {feedback.isCorrect ? (
              <CheckCircleIcon className="w-20 h-20 text-white mx-auto drop-shadow-lg" />
            ) : (
              <XMarkIcon className="w-20 h-20 text-white mx-auto drop-shadow-lg" />
            )}
          </div>
          <motion.p 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-3xl font-black mb-2 tracking-tighter"
          >
            {feedback.isCorrect ? '¡ESPECTACULAR!' : '¡CASI LO TIENES!'}
          </motion.p>
          <motion.p 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg opacity-90 mb-8 font-medium italic leading-tight"
          >
            {feedback.isCorrect 
              ? (streak > 2 ? `¡Mantén esa racha de ${streak}! 🔥` : '¡Sigue así, vas por buen camino!') 
              : <span>La respuesta correcta era:<br/><span className="text-white not-italic font-black text-xl">{targetLanguage === 'eu' ? currentQuestion.target.eu : currentQuestion.target.en}</span></span>
            }
          </motion.p>
          <button
            onClick={onContinue}
            className="bg-white text-primary-dark font-black py-5 px-12 rounded-2xl hover:brightness-110 transition-all shadow-2xl active:scale-95 w-full uppercase tracking-[0.2em] text-xs"
          >
            {lives <= 0 ? 'Ver Resultados Finales' : (questionsHandled >= totalInLevel ? '¡Hecho! Ver Victoria' : 'Siguiente Pregunta')}
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FeedbackOverlay;
