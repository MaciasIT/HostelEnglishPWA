import { XMarkIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

interface ExamHeaderProps {
  currentIndex: number;
  total: number;
  onExit: () => void;
}

export default function ExamHeader({ currentIndex, total, onExit }: ExamHeaderProps) {
  const progress = (currentIndex / total) * 100;

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-white/40 text-xs uppercase tracking-[0.3em] font-black">
          Evaluación en progreso
        </h2>
        <button
          onClick={onExit}
          className="p-2 hover:bg-white/5 rounded-xl text-gray-500 hover:text-white transition-all group"
          aria-label="Salir del examen"
        >
          <XMarkIcon className="w-6 h-6 group-active:scale-90 transition-transform" />
        </button>
      </div>

      <div 
        className="h-2 bg-white/5 rounded-full overflow-hidden mb-2"
        role="progressbar"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progreso del examen"
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          className="h-full bg-accent"
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      <div className="flex justify-between items-center px-1">
        <span className="text-[10px] font-black text-accent uppercase tracking-widest">
          {Math.round(progress)}% Completado
        </span>
        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
          Pregunta #{currentIndex + 1} de {total}
        </span>
      </div>
    </div>
  );
}
