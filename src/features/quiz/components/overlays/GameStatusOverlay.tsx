import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, ArrowPathIcon, SparklesIcon, HomeIcon } from '@heroicons/react/24/outline';

interface GameStatusOverlayProps {
  isGameOver: boolean;
  isLevelComplete: boolean;
  score: number;
  totalQuestions: number;
  streak: number;
  lives: number;
  questionsPerLevel: number;
  onRetry: () => void;
  onExit: () => void;
}

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 }
} as const;

const contentVariants = {
  hidden: { scale: 0.8, opacity: 0, y: 50 },
  visible: { 
    scale: 1, 
    opacity: 1, 
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 25 }
  },
  exit: { scale: 0.8, opacity: 0, y: 50 }
} as const;

const GameStatusOverlay: React.FC<GameStatusOverlayProps> = ({
  isGameOver,
  isLevelComplete,
  score,
  totalQuestions,
  streak,
  lives,
  questionsPerLevel,
  onRetry,
  onExit
}) => {
  return (
    <AnimatePresence>
      {isGameOver && (
        <motion.div
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-primary-dark/95 backdrop-blur-xl overflow-hidden"
        >
          {/* Death Aura */}
          <motion.div 
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 2, opacity: 0.4 }}
            className="absolute w-[600px] h-[600px] rounded-full bg-red-900/40 blur-[100px] pointer-events-none"
          />

          <motion.div
            variants={contentVariants}
            className="max-w-md w-full p-10 bg-gradient-to-br from-gray-900 to-black rounded-[3rem] border border-white/10 text-center shadow-[0_30px_60px_rgba(0,0,0,0.8)] relative z-10"
          >
            <motion.div 
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="w-24 h-24 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/30"
            >
              <XMarkIcon className="w-14 h-14 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
            </motion.div>
            
            <h2 className="text-4xl font-black text-white mb-2 tracking-tighter">FIN DEL JUEGO</h2>
            <p className="text-gray-400 mb-10 font-medium">¡No te rindas! Cada error es un paso más hacia la maestría.</p>

            <div className="grid grid-cols-2 gap-4 mb-10">
              <div className="bg-white/5 p-5 rounded-[2rem] border border-white/5 shadow-inner">
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mb-1">Puntos</p>
                <p className="text-3xl font-black text-white">{score}</p>
              </div>
              <div className="bg-white/5 p-5 rounded-[2rem] border border-white/5 shadow-inner">
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mb-1">Mejor Racha</p>
                <p className="text-3xl font-black text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.4)]">{streak}</p>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onRetry}
              className="w-full bg-accent text-white font-black py-5 rounded-2xl shadow-[0_10px_30px_rgba(230,126,34,0.4)] flex items-center justify-center gap-3 hover:brightness-110 transition-all uppercase tracking-widest text-lg"
            >
              <ArrowPathIcon className="w-6 h-6" />
              REINTENTAR
            </motion.button>
            <button
              onClick={onExit}
              className="w-full mt-6 text-gray-500 font-black py-2 hover:text-white transition-all uppercase tracking-widest text-xs"
            >
              SALIR AL MENÚ
            </button>
          </motion.div>
        </motion.div>
      )}

      {isLevelComplete && (
        <motion.div
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-primary-dark/95 backdrop-blur-xl overflow-hidden"
        >
          {/* Victory Aura */}
          <motion.div 
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 2, opacity: 0.5 }}
            className="absolute w-[600px] h-[600px] rounded-full bg-accent/20 blur-[100px] pointer-events-none"
          />

          <motion.div
            variants={contentVariants}
            className="max-w-md w-full p-10 bg-gradient-to-br from-primary-dark to-black rounded-[3rem] border border-accent/20 text-center shadow-[0_30px_60px_rgba(0,0,0,0.8)] relative z-10"
          >
            <motion.div 
              initial={{ scale: 0, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="w-24 h-24 bg-accent/20 text-accent rounded-full flex items-center justify-center mx-auto mb-6 border border-accent/30 shadow-[0_0_20px_rgba(230,126,34,0.3)]"
            >
              <SparklesIcon className="w-14 h-14" />
            </motion.div>

            <h2 className="text-4xl font-black text-white mb-2 tracking-tighter">¡MISIÓN CUMPLIDA!</h2>
            <p className="text-gray-400 mb-10 font-medium">Impresionante. Has dominado este set de {questionsPerLevel} preguntas.</p>

            <div className="grid grid-cols-2 gap-4 mb-10">
              <div className="bg-white/5 p-5 rounded-[2rem] border border-white/5 shadow-inner">
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mb-1">Puntos</p>
                <p className="text-3xl font-black text-white">{score} / {totalQuestions}</p>
              </div>
              <div className="bg-white/5 p-5 rounded-[2rem] border border-white/5 shadow-inner">
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mb-1">Vidas</p>
                <p className="text-3xl font-black text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.3)]">{lives}</p>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onRetry}
              className="w-full bg-green-600 text-white font-black py-5 rounded-2xl shadow-[0_10px_30px_rgba(22,163,74,0.4)] flex items-center justify-center gap-3 hover:brightness-110 transition-all uppercase tracking-widest text-lg"
            >
              <HomeIcon className="w-6 h-6" />
              SIGUIENTE NIVEL
            </motion.button>
            <button
              onClick={onExit}
              className="w-full mt-6 text-gray-500 font-black py-2 hover:text-white transition-all uppercase tracking-widest text-xs"
            >
              VER OTROS MUNDOS
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GameStatusOverlay;
