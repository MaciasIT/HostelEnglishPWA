import { useState, useCallback, useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Question, QuizMode, ScrambledWord, Feedback } from '../types';
import { getTargetText } from '@/utils/language';

export const useQuizLogic = (category: string | null, mode: QuizMode) => {
  const { frases, progress, advancePhraseProgress, prefs } = useAppStore();
  const { targetLanguage } = prefs;

  const [score, setScore] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [lives, setLives] = useState(3);
  const [streak, setStreak] = useState(0);
  const [questionsHandledInLevel, setQuestionsHandledInLevel] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isLevelComplete, setIsLevelComplete] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [scrambleAnswers, setScrambleAnswers] = useState<ScrambledWord[]>([]);

  const QUESTIONS_PER_LEVEL = 10;

  const filteredFrases = useMemo(() => {
    return category ? frases.filter(f => f.categoria === category) : frases;
  }, [frases, category]);

  const generateQuestion = useCallback(() => {
    if (filteredFrases.length < 4) return;

    const target = filteredFrases[Math.floor(Math.random() * filteredFrases.length)];
    const targetText = getTargetText(target, targetLanguage);

    if (mode === 'multiple') {
      const distractors: string[] = [];
      while (distractors.length < 3) {
        const randomFrase = filteredFrases[Math.floor(Math.random() * filteredFrases.length)];
        const distactorText = getTargetText(randomFrase, targetLanguage);
        if (randomFrase.id !== target.id && !distractors.includes(distactorText)) {
          distractors.push(distactorText);
        }
      }
      const options = [...distractors, targetText].sort(() => Math.random() - 0.5);
      setCurrentQuestion({ id: String(target.id), target, options });
    } else if (mode === 'truefalse') {
      const shouldBeCorrect = Math.random() > 0.5;
      let tfTranslation = targetText;
      if (!shouldBeCorrect) {
        let randomFrase;
        do {
          randomFrase = filteredFrases[Math.floor(Math.random() * filteredFrases.length)];
        } while (randomFrase.id === target.id);
        tfTranslation = getTargetText(randomFrase, targetLanguage);
      }
      setCurrentQuestion({ 
        id: String(target.id), 
        target, 
        options: [], 
        tfTranslation, 
        tfIsCorrect: shouldBeCorrect 
      });
    } else if (mode === 'scramble') {
      const words = targetText.split(' ');
      const scrambledWords = words.map((w, i) => ({ id: `${i}-${w}`, text: w })).sort(() => Math.random() - 0.5);
      setCurrentQuestion({ id: String(target.id), target, options: [], scrambledWords });
      setScrambleAnswers([]);
    }

    setFeedback(null);
  }, [filteredFrases, mode, targetLanguage]);

  const handleAnswer = useCallback((answer: boolean | string) => {
    if (feedback || !currentQuestion) return;

    const targetText = (targetLanguage === 'eu' ? currentQuestion.target.eu : currentQuestion.target.en) || currentQuestion.target.en;

    let isCorrect = false;
    if (mode === 'multiple') {
      isCorrect = answer === targetText;
    } else if (mode === 'truefalse') {
      isCorrect = answer === currentQuestion.tfIsCorrect;
    } else if (mode === 'scramble') {
      isCorrect = answer === targetText;
    }

    if (isCorrect) {
      setScore(s => s + 1);
      setStreak(s => s + 1);
      setFeedback({ isCorrect: true, message: '¡Correcto!' });

      if ((progress[currentQuestion.target.id] || 0) < 2) {
        advancePhraseProgress(String(currentQuestion.target.id));
      }
    } else {
      const newLives = lives - 1;
      setLives(newLives);
      setStreak(0);
      setFeedback({ isCorrect: false, message: `Incorrecto. Era: ${targetText}` });
    }
    setTotalQuestions(t => t + 1);
    setQuestionsHandledInLevel(q => q + 1);
  }, [currentQuestion, feedback, lives, mode, progress, targetLanguage, advancePhraseProgress]);

  const handleNextQuestion = useCallback(() => {
    if (lives <= 0) {
      setIsGameOver(true);
      return;
    }
    if (questionsHandledInLevel >= QUESTIONS_PER_LEVEL) {
      setIsLevelComplete(true);
      return;
    }
    generateQuestion();
  }, [lives, questionsHandledInLevel, generateQuestion]);

  const startQuiz = useCallback(() => {
    setScore(0);
    setTotalQuestions(0);
    setLives(3);
    setStreak(0);
    setQuestionsHandledInLevel(0);
    setIsGameOver(false);
    setIsLevelComplete(false);
    generateQuestion();
  }, [generateQuestion]);

  const actions = useMemo(() => ({
    startQuiz,
    handleAnswer,
    handleNextQuestion,
    setScrambleAnswers
  }), [startQuiz, handleAnswer, handleNextQuestion, setScrambleAnswers]);

  return {
    state: {
      score,
      totalQuestions,
      lives,
      streak,
      questionsHandledInLevel,
      isGameOver,
      isLevelComplete,
      currentQuestion,
      feedback,
      scrambleAnswers,
      QUESTIONS_PER_LEVEL,
      targetLanguage
    },
    actions
  };
};
