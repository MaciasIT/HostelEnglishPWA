import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrophyIcon, 
  ShieldCheckIcon, 
  SparklesIcon, 
  FireIcon, 
  XMarkIcon 
} from '@heroicons/react/24/outline';
import { Phrase } from '@/store/useAppStore';
import { getTargetText } from '@/utils/language';

interface ExamResultsProps {
  score: number;
  total: number;
  incorrectIds: string[];
  phrases: Phrase[];
  targetLanguage: 'en' | 'eu' | 'es';
  onRestart: () => void;
  onExit: () => void;
}

export default function ExamResults({
  score,
  total,
  incorrectIds,
  phrases,
  targetLanguage,
  onRestart,
  onExit
}: ExamResultsProps) {
  const [showErrors, setShowErrors] = useState(false);
  const passed = score >= total * 0.8;
  const precision = Math.round((score / total) * 100);

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-12">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`p-10 rounded-[3rem] border-2 shadow-2xl backdrop-blur-xl text-center relative overflow-hidden ${
          passed ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'
        }`}
      >
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={`w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl ${
            passed ? 'bg-green-500' : 'bg-red-500'
          }`}
          aria-hidden="true"
        >
          {passed ? (
            <TrophyIcon className="w-14 h-14 text-white" />
          ) : (
            <ShieldCheckIcon className="w-14 h-14 text-white opacity-50" />
          )}
        </motion.div>

        <h2 
          className="text-5xl font-black text-white mb-2 tracking-tighter uppercase"
          role="status"
          aria-live="assertive"
        >
          {passed ? '¡APROBADO!' : 'CASI LO TIENES'}
        </h2>

        <p className="text-gray-400 mb-10 text-lg">
          {passed
            ? 'Has demostrado un gran dominio de la lengua.'
            : 'Un poco más de estudio y lo conseguirás.'}
        </p>

        <div className="grid grid-cols-2 gap-4 mb-10">
          <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
            <div className="flex items-center justify-center gap-2 mb-1">
              <FireIcon className="w-4 h-4 text-orange-500" />
              <p className="text-[10px] uppercase font-black text-gray-500 tracking-widest">Puntuación</p>
            </div>
            <p className="text-4xl font-black text-white">{score}<span className="text-lg text-gray-600 font-bold">/{total}</span></p>
          </div>
          <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
            <div className="flex items-center justify-center gap-2 mb-1">
              <SparklesIcon className="w-4 h-4 text-accent" />
              <p className="text-[10px] uppercase font-black text-gray-500 tracking-widest">Precisión</p>
            </div>
            <p className="text-4xl font-black text-accent">{precision}%</p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <button
            onClick={onRestart}
            className="bg-accent text-white font-black py-5 rounded-2xl text-xl shadow-2xl hover:brightness-110 active:scale-95 transition-all tracking-widest uppercase"
          >
            Nuevo Examen
          </button>

          {incorrectIds.length > 0 && (
            <button
              onClick={() => setShowErrors(true)}
              className="bg-red-500/20 text-red-400 font-bold py-4 rounded-2xl hover:bg-red-500/30 transition-all flex items-center justify-center gap-2 border border-red-500/20"
            >
              <ShieldCheckIcon className="w-5 h-5" />
              VER ERRORES ({incorrectIds.length})
            </button>
          )}

          <button
            onClick={onExit}
            className="bg-white/5 text-white font-bold py-4 rounded-2xl hover:bg-white/10 active:scale-95 transition-all uppercase tracking-widest text-xs"
          >
            Volver al Inicio
          </button>
        </div>
      </motion.div>

      {/* Modal de Errores */}
      <AnimatePresence>
        {showErrors && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-primary-dark/95 backdrop-blur-xl"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-title"
              className="max-w-2xl w-full max-h-[80vh] bg-white/5 rounded-[3rem] border border-white/10 p-10 shadow-2xl overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 id="modal-title" className="text-2xl font-black text-white flex items-center gap-3">
                  <ShieldCheckIcon className="w-8 h-8 text-red-500" aria-hidden="true" />
                  Repaso Crítico
                </h3>
                <button 
                  onClick={() => setShowErrors(false)} 
                  className="text-gray-500 hover:text-white"
                  aria-label="Cerrar modal de errores"
                >
                  <XMarkIcon className="w-8 h-8" />
                </button>
              </div>

              <div className="space-y-4">
                {incorrectIds.map(id => {
                  const p = phrases.find(item => String(item.id) === id);
                  if (!p) return null;
                  return (
                    <div key={id} className="p-6 bg-black/40 rounded-2xl border border-white/5">
                      <p className="text-sm text-gray-500 italic mb-2">"{p.es}"</p>
                      <p className="text-white font-black text-lg">{getTargetText(p, targetLanguage)}</p>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => setShowErrors(false)}
                className="mt-8 w-full bg-white text-primary-dark font-black py-4 rounded-2xl uppercase tracking-widest"
              >
                Cerrar Repaso
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
