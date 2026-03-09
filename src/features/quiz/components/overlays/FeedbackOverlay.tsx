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
  return (
    <AnimatePresence>
      {feedback && currentQuestion && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-primary-dark/80 backdrop-blur-md overflow-hidden"
        >
          {/* Background Aura */}
          <motion.div 
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 2, opacity: 0.6 }}
            className={`absolute w-[600px] h-[600px] rounded-full blur-[100px] pointer-events-none ${
              feedback.isCorrect ? 'bg-green-500/30' : 'bg-red-500/30'
            }`}
          />

          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className={`max-w-md w-full p-10 rounded-[3rem] text-center shadow-2xl border-2 relative z-10 
              ${feedback.isCorrect 
                ? 'bg-gradient-to-br from-green-600 to-green-800 border-green-400' 
                : 'bg-gradient-to-br from-red-600 to-red-800 border-red-400'}`}
          >
            <motion.div 
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.1, type: "spring" }}
              className="mb-6 flex justify-center"
            >
              {feedback.isCorrect ? (
                <div className="p-4 bg-white/20 rounded-full" aria-hidden="true">
                  <CheckCircleIcon className="w-20 h-20 text-white drop-shadow-lg" />
                </div>
              ) : (
                <div className="p-4 bg-white/20 rounded-full" aria-hidden="true">
                  <XMarkIcon className="w-20 h-20 text-white drop-shadow-lg" />
                </div>
              )}
            </motion.div>

            <h3 className="text-4xl font-black mb-2 text-white tracking-tighter">
              {feedback.isCorrect ? '¡CORRECTO!' : '¡UPS!'}
            </h3>

            <div className="mb-10 min-h-[60px] flex flex-col justify-center">
              {feedback.isCorrect ? (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xl text-white/90 font-bold"
                >
                  {streak > 2 ? (
                    <motion.span 
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ repeat: Infinity, duration: 1 }}
                      className="flex items-center justify-center gap-2 text-orange-300 font-black drop-shadow-[0_0_10px_rgba(253,186,116,0.3)]"
                    >
                      ¡Racha de {streak} 🔥!
                    </motion.span>
                  ) : '¡Buen trabajo!'}
                </motion.p>
              ) : (
                <div className="space-y-1">
                  <p className="text-sm text-white/60 uppercase tracking-widest font-black">Era:</p>
                  <p className="text-2xl text-white font-black italic">
                    {targetLanguage === 'eu' ? currentQuestion.target.eu : currentQuestion.target.en}
                  </p>
                </div>
              )}
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onContinue}
              className="bg-white text-primary-dark font-black py-5 px-12 rounded-2xl hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] transition-all shadow-2xl w-full uppercase tracking-widest text-lg"
            >
              {lives <= 0 ? 'Ver Resultados' : (questionsHandled >= totalInLevel ? 'Ver Victoria' : 'Siguiente')}
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FeedbackOverlay;
