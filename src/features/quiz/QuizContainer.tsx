import React, { useEffect } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { QuizMode, ScrambledWord } from './types';
import { useQuizLogic } from './hooks/useQuizLogic';
import { useSpeech } from './hooks/useSpeech';
import QuizHeader from './components/QuizHeader';
import MultipleChoiceMode from './components/modes/MultipleChoiceMode';
import TrueFalseMode from './components/modes/TrueFalseMode';
import ScrambleMode from './components/modes/ScrambleMode';
import FeedbackOverlay from './components/overlays/FeedbackOverlay';
import GameStatusOverlay from './components/overlays/GameStatusOverlay';

interface QuizContainerProps {
  category: string | null;
  mode: QuizMode;
  onExit: () => void;
}

const QuizContainer: React.FC<QuizContainerProps> = ({ category, mode, onExit }) => {
  const { state, actions } = useQuizLogic(category, mode);
  const { speak } = useSpeech();

  useEffect(() => {
    actions.startQuiz();
  }, [actions.startQuiz]);

  const handleAnswer = (answer: string | boolean) => {
    actions.handleAnswer(answer);
    
    // Play audio feedback for the target text
    if (state.currentQuestion) {
      const targetText = (state.targetLanguage === 'eu' 
        ? state.currentQuestion.target.eu 
        : state.currentQuestion.target.en) || state.currentQuestion.target.en;
      speak(targetText);
    }
  };

  const handleScrambleSelect = (word: ScrambledWord) => {
    actions.setScrambleAnswers([...state.scrambleAnswers, word]);
  };

  const handleScrambleRemove = (word: ScrambledWord) => {
    actions.setScrambleAnswers(state.scrambleAnswers.filter(w => w.id !== word.id));
  };

  if (!state.currentQuestion && !state.isGameOver && !state.isLevelComplete) {
    return (
      <div className="flex flex-col items-center justify-center p-20">
        <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin shadow-2xl"></div>
        <p className="mt-6 text-gray-500 font-bold uppercase tracking-widest">Preparando el desafío...</p>
      </div>
    );
  }

  return (
    <LayoutGroup>
      <motion.div layout className="max-w-xl mx-auto px-4" data-testid="quiz-container">
        <QuizHeader 
          lives={state.lives}
          streak={state.streak}
          progress={(state.questionsHandledInLevel / state.QUESTIONS_PER_LEVEL) * 100}
          onExit={onExit}
        />

        <motion.div 
          layout
          className="bg-white/10 p-8 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur-2xl border border-white/20 relative overflow-hidden"
        >
          {/* Animated background element */}
          <motion.div 
            animate={{ 
              rotate: 360,
              scale: [1, 1.1, 1],
              opacity: [0.05, 0.08, 0.05]
            }}
            transition={{ 
              rotate: { duration: 20, repeat: Infinity, ease: "linear" },
              scale: { duration: 8, repeat: Infinity, ease: "easeInOut" },
              opacity: { duration: 8, repeat: Infinity, ease: "easeInOut" }
            }}
            className="absolute -top-24 -right-24 w-64 h-64 bg-accent rounded-full blur-[80px] pointer-events-none"
          />

          <motion.h2 layout className="text-[10px] uppercase tracking-[0.2em] text-accent font-black mb-4 flex items-center gap-2">
            <span className="w-6 h-[1px] bg-accent"></span>
            {mode === 'truefalse' ? 'Identifica si es correcto' : `Traduce al ${state.targetLanguage === 'eu' ? 'euskera' : 'inglés'}`}
          </motion.h2>

          <AnimatePresence mode="wait">
            <motion.div
              key={state.currentQuestion?.id || 'empty'}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              {state.currentQuestion && (
                <p 
                  data-testid="quiz-question" 
                  className="text-2xl sm:text-3xl font-black mb-10 text-white italic leading-[1.1] text-center"
                >
                  "{state.currentQuestion.target.es}"
                </p>
              )}

              <div className="relative min-h-[200px]">
                {mode === 'multiple' && state.currentQuestion && (
                  <MultipleChoiceMode 
                    currentQuestion={state.currentQuestion}
                    feedback={state.feedback}
                    targetLanguage={state.targetLanguage}
                    onAnswer={handleAnswer}
                  />
                )}

                {mode === 'truefalse' && state.currentQuestion && (
                  <TrueFalseMode 
                    currentQuestion={state.currentQuestion}
                    feedback={state.feedback}
                    onAnswer={handleAnswer}
                  />
                )}

                {mode === 'scramble' && state.currentQuestion && (
                  <ScrambleMode 
                    currentQuestion={state.currentQuestion}
                    feedback={state.feedback}
                    scrambleAnswers={state.scrambleAnswers}
                    onAnswer={handleAnswer}
                    onSelectWord={handleScrambleSelect}
                    onRemoveWord={handleScrambleRemove}
                    onReset={() => actions.setScrambleAnswers([])}
                  />
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          <FeedbackOverlay 
            feedback={state.feedback}
            currentQuestion={state.currentQuestion}
            streak={state.streak}
            targetLanguage={state.targetLanguage}
            lives={state.lives}
            questionsHandled={state.questionsHandledInLevel}
            totalInLevel={state.QUESTIONS_PER_LEVEL}
            onContinue={actions.handleNextQuestion}
          />

          <GameStatusOverlay 
            isGameOver={state.isGameOver}
            isLevelComplete={state.isLevelComplete}
            score={state.score}
            totalQuestions={state.totalQuestions}
            streak={state.streak}
            lives={state.lives}
            questionsPerLevel={state.QUESTIONS_PER_LEVEL}
            onRetry={actions.startQuiz}
            onExit={onExit}
          />
        </motion.div>
      </motion.div>
    </LayoutGroup>
  );
};

export default QuizContainer;

