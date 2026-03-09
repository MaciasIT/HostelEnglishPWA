import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, ArrowPathIcon, SparklesIcon } from '@heroicons/react/24/outline';

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
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-primary-dark/95 backdrop-blur-xl"
        >
          <div className="max-w-md w-full p-10 bg-white/5 rounded-[3rem] border border-white/10 text-center shadow-2xl">
            <div className="w-20 h-20 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <XMarkIcon className="w-12 h-12" />
            </div>
            <h2 className="text-4xl font-black text-white mb-2 tracking-tighter">FIN DEL JUEGO</h2>
            <p className="text-gray-400 mb-8">¡No te rindas! La práctica hace al maestro.</p>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Puntos</p>
                <p className="text-2xl font-black text-white">{score}</p>
              </div>
              <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Máxima Racha</p>
                <p className="text-2xl font-black text-orange-500">{streak}</p>
              </div>
            </div>

            <button
              onClick={onRetry}
              className="w-full bg-accent text-white font-black py-5 rounded-2xl shadow-xl flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all"
            >
              <ArrowPathIcon className="w-6 h-6" />
              REINTENTAR
            </button>
            <button
              onClick={onExit}
              className="w-full mt-4 text-gray-500 font-bold py-3 hover:text-white transition-all"
            >
              SALIR AL MENÚ
            </button>
          </div>
        </motion.div>
      )}

      {isLevelComplete && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-primary-dark/95 backdrop-blur-xl"
        >
          <div className="max-w-md w-full p-10 bg-white/5 rounded-[3rem] border border-white/10 text-center shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-accent/5 pointer-events-none"></div>
            <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 relative">
              <SparklesIcon className="w-12 h-12" />
            </div>
            <h2 className="text-4xl font-black text-white mb-2 tracking-tighter">¡MISIÓN CUMPLIDA!</h2>
            <p className="text-gray-400 mb-8">Has completado el set de {questionsPerLevel} preguntas con éxito.</p>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Puntos</p>
                <p className="text-2xl font-black text-white">{score} / {totalQuestions}</p>
              </div>
              <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Vidas Restantes</p>
                <p className="text-2xl font-black text-red-500">{lives}</p>
              </div>
            </div>

            <button
              onClick={onRetry}
              className="w-full bg-green-600 text-white font-black py-5 rounded-2xl shadow-xl flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all"
            >
              SIGUIENTE NIVEL
            </button>
            <button
              onClick={onExit}
              className="w-full mt-4 text-gray-500 font-bold py-3 hover:text-white transition-all"
            >
              VER OTROS MODOS
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GameStatusOverlay;
