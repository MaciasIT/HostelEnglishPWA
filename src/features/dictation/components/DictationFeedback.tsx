import { CheckCircleIcon, XCircleIcon, LanguageIcon } from '@heroicons/react/24/outline';
import { Phrase } from '@/store/useAppStore';

interface DictationFeedbackProps {
  feedback: { isCorrect: boolean, message: string } | null;
  correctAnswer: string | null;
  showTranslation: boolean;
  currentPhrase: Phrase | null;
}

export default function DictationFeedback({
  feedback,
  correctAnswer,
  showTranslation,
  currentPhrase
}: DictationFeedbackProps) {
  if (!feedback) return null;

  return (
    <div 
      className={`mt-10 p-8 rounded-[2rem] text-center animate-in zoom-in-95 duration-500 border-2 ${
        feedback.isCorrect ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center">
        {feedback.isCorrect ? (
          <CheckCircleIcon className="w-12 h-12 text-green-500 mb-3" aria-hidden="true" />
        ) : (
          <XCircleIcon className="w-12 h-12 text-red-500 mb-3" aria-hidden="true" />
        )}
        <p className={`text-2xl font-black ${feedback.isCorrect ? 'text-green-400' : 'text-red-400'}`}>
          {feedback.message}
        </p>
      </div>

      {correctAnswer && !feedback.isCorrect && (
        <div className="mt-6 pt-6 border-t border-white/5">
          <p className="text-[10px] text-gray-500 uppercase font-black mb-2">Respuesta Correcta:</p>
          <p className="text-xl text-white font-black italic">"{correctAnswer}"</p>
        </div>
      )}

      {showTranslation && currentPhrase?.es && (
        <div className="mt-4 flex items-center justify-center gap-2 text-gray-400">
          <LanguageIcon className="w-4 h-4" aria-hidden="true" />
          <p className="text-sm italic font-medium">{currentPhrase.es}</p>
        </div>
      )}
    </div>
  );
}
