import React, { useEffect } from 'react';
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
    <div className="max-w-xl mx-auto px-4" data-testid="quiz-container">
      <QuizHeader 
        lives={state.lives}
        streak={state.streak}
        progress={(state.questionsHandledInLevel / state.QUESTIONS_PER_LEVEL) * 100}
        onExit={onExit}
      />

      <div className="bg-white/10 p-8 rounded-3xl shadow-2xl backdrop-blur-xl border border-white/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-accent opacity-5 blur-3xl rounded-full"></div>

        <h2 className="text-[10px] uppercase tracking-[0.2em] text-accent font-black mb-4 flex items-center gap-2">
          <span className="w-6 h-[1px] bg-accent"></span>
          {mode === 'truefalse' ? 'Identifica si es correcto' : `Traduce al ${state.targetLanguage === 'eu' ? 'euskera' : 'inglés'}`}
        </h2>

        {state.currentQuestion && (
          <p data-testid="quiz-question" className="text-2xl sm:text-3xl font-black mb-10 text-white italic leading-[1.1] text-center">
            "{state.currentQuestion.target.es}"
          </p>
        )}

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
      </div>
    </div>
  );
};

export default QuizContainer;
