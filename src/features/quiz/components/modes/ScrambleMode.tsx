import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, scale: 0.5 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { type: "spring", stiffness: 400, damping: 25 }
  },
} as const;

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
      <motion.div 
        layout
        className="min-h-[140px] p-8 bg-black/40 rounded-[2rem] border-2 border-dashed border-white/10 flex flex-wrap gap-3 shadow-inner relative"
      >
        <AnimatePresence>
          {scrambleAnswers.map((word) => (
            <motion.button
              layoutId={`word-${word.id}`}
              key={word.id}
              onClick={() => onRemoveWord(word)}
              className="px-5 py-3 bg-accent rounded-xl font-black text-white shadow-xl hover:bg-red-500 transition-colors z-10"
              disabled={!!feedback}
            >
              {word.text}
            </motion.button>
          ))}
        </AnimatePresence>
        {scrambleAnswers.length === 0 && (
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            className="text-white italic text-center w-full mt-4 pointer-events-none"
          >
            Toca las palabras para construir la frase
          </motion.p>
        )}
      </motion.div>

      {/* Source Zone */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-wrap gap-3 justify-center pt-6 min-h-[100px]"
      >
        <AnimatePresence>
          {currentQuestion.scrambledWords?.map((word) => {
            const isUsed = scrambleAnswers.some(w => w.id === word.id);

            return !isUsed && (
              <motion.button
                layoutId={`word-${word.id}`}
                key={word.id}
                variants={itemVariants}
                onClick={() => onSelectWord(word)}
                className="px-5 py-3 bg-white/10 border border-white/10 rounded-xl font-black text-white hover:bg-white/20 active:scale-90 transition-all shadow-md"
                disabled={!!feedback}
              >
                {word.text}
              </motion.button>
            );
          })}
        </AnimatePresence>
      </motion.div>

      <div className="pt-8 flex flex-col items-center gap-4">
        <motion.button
          layout
          onClick={() => onAnswer(scrambleAnswers.map(w => w.text).join(' '))}
          className={`px-12 py-4 bg-accent rounded-2xl font-black uppercase tracking-widest shadow-2xl transition-all hover:scale-105 active:scale-95 ${scrambleAnswers.length === 0 || !!feedback ? 'opacity-50 pointer-events-none' : ''}`}
        >
          Comprobar
        </motion.button>
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
