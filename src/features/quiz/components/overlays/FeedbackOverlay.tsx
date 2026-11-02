import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { SpeakerWaveIcon } from '@heroicons/react/24/outline';
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
  onSpeak?: () => void;
}

/**
 * Bottom-sheet no invasivo: sin backdrop, la frase y las opciones
 * permanecen visibles. Se renderiza en un portal para que los transforms
 * de framer-motion de los ancestros no rompan `position: fixed`.
 */
const FeedbackOverlay: React.FC<FeedbackOverlayProps> = ({
  feedback,
  currentQuestion,
  streak,
  targetLanguage,
  lives,
  questionsHandled,
  totalInLevel,
  onContinue,
  onSpeak,
}) => {
  const ok = feedback?.isCorrect;
  const solution = currentQuestion
    ? (targetLanguage === 'eu' ? currentQuestion.target.eu : currentQuestion.target.en) || currentQuestion.target.en
    : '';

  const sheet = (
    <AnimatePresence>
      {feedback && currentQuestion && (
        <motion.div
          key="feedback-sheet"
          role="status"
          aria-live="polite"
          data-testid="feedback-sheet"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          className={`fixed bottom-0 left-0 right-0 z-50 px-5 pt-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] max-h-[min(40dvh,20rem)] overflow-y-auto overscroll-contain rounded-t-3xl border-t-4 shadow-[0_-12px_40px_rgba(0,0,0,0.35)] text-primary ${
            ok ? 'bg-surface-elevated border-success' : 'bg-surface-elevated border-error'
          }`}
        >
          <div className="max-w-xl mx-auto space-y-4">
            <div className="flex items-start justify-between gap-3">
              {ok ? (
                <div className="min-w-0">
                  <p className="text-2xl font-black">✓ ¡Correcto!</p>
                  {streak > 2 && <p className="text-sm font-bold text-amber-500">¡Racha de {streak} 🔥!</p>}
                  <p className="text-xs font-bold uppercase tracking-widest text-secondary mt-2">Respuesta modelo:</p>
                  <p data-testid="quiz-feedback-solution" className="text-xl font-black italic break-words">{solution}</p>
                </div>
              ) : (
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-widest text-secondary">✕ Solución correcta:</p>
                  <p data-testid="quiz-feedback-solution" className="text-xl font-black italic break-words">{solution}</p>
                </div>
              )}
              {onSpeak && (
                <button
                  type="button"
                  onClick={onSpeak}
                  aria-label="Escuchar pronunciación"
                  className="shrink-0 w-12 h-12 rounded-full bg-surface border border-border/15 hover:bg-surface-hover flex items-center justify-center"
                >
                  <SpeakerWaveIcon className="w-6 h-6" aria-hidden="true" />
                </button>
              )}
            </div>

            <button
              type="button"
              autoFocus
              onClick={onContinue}
              className={`w-full min-h-14 py-4 rounded-2xl bg-white font-black uppercase tracking-widest text-lg active:scale-95 transition-transform ${
                ok ? 'text-emerald-800' : 'text-red-800'
              }`}
            >
              {lives <= 0 ? 'Ver Resultados' : questionsHandled >= totalInLevel ? 'Ver Victoria' : 'CONTINUAR'}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return typeof document === 'undefined' ? sheet : createPortal(sheet, document.body);
};

export default FeedbackOverlay;
