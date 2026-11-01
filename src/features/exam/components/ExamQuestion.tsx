import { motion } from 'framer-motion';
import { CheckBadgeIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface ExamQuestionProps {
  question: string;
  options: string[];
  selectedOption: string | null;
  correctAnswer: string;
  onAnswer: (option: string) => void;
}

export default function ExamQuestion({
  question,
  options,
  selectedOption,
  correctAnswer,
  onAnswer
}: ExamQuestionProps) {
  const isAnswered = selectedOption !== null;

  return (
    <div className="space-y-8">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface/10 p-10 rounded-[2.5rem] shadow-2xl border border-border/20 backdrop-blur-md"
      >
        <p id="question-label" className="text-[10px] uppercase font-black text-accent tracking-[0.2em] mb-4">Traduce esta frase:</p>
        <h3 id="current-question" className="text-3xl sm:text-4xl font-black text-primary mb-12 italic leading-tight">
          "{question}"
        </h3>

        <div className="grid grid-cols-1 gap-4">
          {options.map((opt, i) => {
            const isCorrect = opt === correctAnswer;
            const isSelected = selectedOption === opt;
            
            let btnClass = "bg-surface/5 border-border/10 hover:border-accent hover:bg-surface/10";
            if (isSelected) {
              btnClass = isCorrect 
                ? "bg-success border-green-400 text-primary" 
                : "bg-error border-red-400 text-primary";
            } else if (isAnswered) {
              btnClass = isCorrect 
                ? "bg-success/20 border-green-500/30 text-green-200" 
                : "bg-surface/5 border-border/5 opacity-30";
            }

            return (
              <motion.button
                key={i}
                whileHover={!isAnswered ? { scale: 1.02, x: 5 } : {}}
                whileTap={!isAnswered ? { scale: 0.98 } : {}}
                onClick={() => onAnswer(opt)}
                disabled={isAnswered}
                aria-label={`Opción ${i + 1}: ${opt}${isSelected ? (isCorrect ? ", Correcta" : ", Incorrecta") : ""}`}
                aria-describedby="current-question"
                className={`p-6 text-left rounded-2xl font-bold border-2 transition-all ${btnClass}`}
              >
                <div className="flex justify-between items-center">
                  <span>{opt}</span>
                  {isSelected && (
                    isCorrect 
                      ? <CheckBadgeIcon className="w-6 h-6" /> 
                      : <XMarkIcon className="w-6 h-6" />
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Feedback contextual tras responder */}
      {isAnswered && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          role="alert"
          aria-live="polite"
          className={`p-6 rounded-[2rem] border-2 ${
            selectedOption === correctAnswer 
              ? 'bg-success/10 border-green-500/30' 
              : 'bg-error/10 border-red-500/30'
          }`}
        >
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-full ${selectedOption === correctAnswer ? 'bg-success' : 'bg-error'}`}>
              {selectedOption === correctAnswer 
                ? <CheckBadgeIcon className="w-6 h-6 text-primary" /> 
                : <XMarkIcon className="w-6 h-6 text-primary" />
              }
            </div>
            <div>
              <h3 className={`text-xl font-black ${selectedOption === correctAnswer ? 'text-green-400' : 'text-red-400'}`}>
                {selectedOption === correctAnswer ? '¡Correcto!' : 'Oh, no es exacto'}
              </h3>
              {selectedOption !== correctAnswer && (
                <div className="mt-1 text-secondary">
                  La respuesta correcta es:
                  <p className="text-primary font-black text-lg tracking-tight">{correctAnswer}</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
