import React from 'react';
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
      <div className="flex justify-between items-center bg-white/5 border border-white/10 p-4 rounded-2xl shadow-lg backdrop-blur-md overflow-hidden relative">
        <button
          onClick={onExit}
          className="p-2 text-gray-500 hover:text-white"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>

        {/* Lives */}
        <div className="flex gap-1">
          {[...Array(3)].map((_, i) => (
            <HeartIcon key={i} className={`w-6 h-6 ${i < lives ? 'text-red-500 fill-red-500' : 'text-gray-700'}`} />
          ))}
        </div>

        {/* Streak */}
        <div className={`flex items-center gap-1 transition-all ${streak >= 3 ? 'text-orange-500 scale-110' : 'text-gray-500'}`}>
          <FireIcon className="w-5 h-5" />
          <span className="font-black text-sm">{streak}</span>
        </div>

        {/* Progress Bar */}
        <div className="absolute bottom-0 left-0 h-1 bg-accent transition-all duration-500" style={{ width: `${progress}%` }}></div>
      </div>
    </div>
  );
};

export default QuizHeader;
