import React from 'react';
import { motion } from 'framer-motion';
import { Question, Feedback } from '../../types';

interface TrueFalseModeProps {
  currentQuestion: Question;
  feedback: Feedback | null;
  onAnswer: (answer: boolean) => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 25 }
  },
} as const;

const TrueFalseMode: React.FC<TrueFalseModeProps> = ({ 
  currentQuestion, 
  feedback, 
  onAnswer 
}) => {
  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-10"
    >
      <motion.div 
        variants={itemVariants}
        className="p-8 bg-black/30 rounded-[2rem] border border-white/10 text-center shadow-inner"
      >
        <p className="text-[10px] text-accent font-black uppercase tracking-widest mb-3">Traducción propuesta:</p>
        <p className="text-3xl font-black text-white italic">"{currentQuestion.tfTranslation}"</p>
      </motion.div>

      <div className="grid grid-cols-2 gap-6">
        <motion.button
          variants={itemVariants}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onAnswer(true)}
          className={`p-8 rounded-[1.8rem] font-black text-2xl transition-all border-2 shadow-lg ${feedback && currentQuestion.tfIsCorrect ? 'bg-green-600 border-green-400 scale-105 shadow-[0_0_30px_rgba(34,197,94,0.4)]' :
            feedback && !currentQuestion.tfIsCorrect ? 'bg-gray-800 border-white/10 opacity-30 shadow-none' :
              'bg-blue-600 border-blue-500 hover:brightness-110'
            }`}
          disabled={!!feedback}
        >
          SÍ
        </motion.button>
        <motion.button
          variants={itemVariants}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onAnswer(false)}
          className={`p-8 rounded-[1.8rem] font-black text-2xl transition-all border-2 shadow-lg ${feedback && !currentQuestion.tfIsCorrect ? 'bg-green-600 border-green-400 scale-105 shadow-[0_0_30px_rgba(34,197,94,0.4)]' :
            feedback && currentQuestion.tfIsCorrect ? 'bg-gray-800 border-white/10 opacity-30 shadow-none' :
              'bg-red-600 border-red-500 hover:brightness-110'
            }`}
          disabled={!!feedback}
        >
          NO
        </motion.button>
      </div>
    </motion.div>
  );
};

export default TrueFalseMode;
