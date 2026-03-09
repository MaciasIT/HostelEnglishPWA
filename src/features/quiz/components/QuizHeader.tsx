import React from 'react';
import { motion } from 'framer-motion';
import { XMarkIcon, HeartIcon, FireIcon } from '@heroicons/react/24/outline';

interface QuizHeaderProps {
  lives: number;
  streak: number;
  progress: number;
  onExit: () => void;
}

const QuizHeader: React.FC<QuizHeaderProps> = ({ lives, streak, progress, onExit }) => {
  return (
    <div className="flex flex-col gap-4 mb-6">
      <div className="flex justify-between items-center bg-white/5 border border-white/10 p-5 rounded-[1.8rem] shadow-xl backdrop-blur-md overflow-hidden relative">
        <motion.button
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          onClick={onExit}
          aria-label="Salir del quiz"
          className="p-2 text-gray-400 hover:text-white transition-colors"
        >
          <XMarkIcon className="w-6 h-6" aria-hidden="true" />
        </motion.button>

        {/* Lives */}
        <div className="flex gap-2 bg-black/20 p-2 px-3 rounded-2xl border border-white/5" aria-label={`Vidas restantes: ${lives}`}>
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              animate={i < lives && lives === 1 ? { scale: [1, 1.2, 1] } : {}}
              transition={{ repeat: Infinity, duration: 0.8 }}
            >
              <HeartIcon 
                className={`w-7 h-7 transition-all duration-500 ${
                  i < lives 
                    ? 'text-red-500 fill-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]' 
                    : 'text-gray-800 scale-90 opacity-40'
                }`} 
                aria-hidden="true"
              />
            </motion.div>
          ))}
        </div>

        {/* Streak */}
        <motion.div 
          animate={streak >= 3 ? { scale: [1, 1.1, 1] } : {}}
          transition={{ repeat: Infinity, duration: 2 }}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl border transition-all duration-500 ${
            streak >= 3 
              ? 'bg-orange-500/20 border-orange-500/30 text-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.2)]' 
              : 'bg-white/5 border-white/5 text-gray-500'
          }`}
          aria-label={`Racha de ${streak} respuestas correctas`}
        >
          <motion.div
            animate={streak >= 3 ? { 
              y: [0, -2, 0],
              filter: ["brightness(1)", "brightness(1.5)", "brightness(1)"]
            } : {}}
            transition={{ repeat: Infinity, duration: 1 }}
          >
            <FireIcon className="w-6 h-6" aria-hidden="true" />
          </motion.div>
          <span className="font-black text-lg">{streak}</span>
        </motion.div>

        {/* Progress Bar Container */}
        <div className="absolute bottom-0 left-0 w-full h-[3px] bg-white/5" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label={`Progreso del quiz: ${progress}%`}>
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ type: "spring", stiffness: 50, damping: 15 }}
            className="h-full bg-accent shadow-[0_0_10px_rgba(230,126,34,0.8)]"
          />
        </div>
      </div>
    </div>
  );
};

export default QuizHeader;
