import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppStore, Phrase } from '@/store/useAppStore';
import { getTargetText } from '@/utils/language';
import { shuffle } from '@/utils/shuffle';

export type ExamState = 'setup' | 'active' | 'results';

export type ExamResultsData = {
  score: number;
  total: number;
  correctIds: string[];
  incorrectIds: string[];
};

export function useExamLogic() {
  const { 
    frases, 
    progress, 
    advancePhraseProgress, 
    recordExamResult, 
    frasesLoaded, 
    loadFrases, 
    targetLanguage 
  } = useAppStore(state => ({
    frases: state.frases,
    progress: state.progress,
    advancePhraseProgress: state.advancePhraseProgress,
    recordExamResult: state.recordExamResult,
    frasesLoaded: state.frasesLoaded,
    loadFrases: state.loadFrases,
    targetLanguage: state.prefs.targetLanguage,
  }));

  const [examState, setExamState] = useState<ExamState>('setup');
  const [examPhrases, setExamPhrases] = useState<Phrase[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<ExamResultsData>({ score: 0, total: 0, correctIds: [], incorrectIds: [] });
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);

  useEffect(() => {
    if (!frasesLoaded) loadFrases();
  }, [frasesLoaded, loadFrases]);

  const currentQuestion = useMemo(() => examPhrases[currentIndex], [examPhrases, currentIndex]);

  const generateOptions = useCallback((target: Phrase) => {
    const correctText = getTargetText(target, targetLanguage);
    const distractors = frases
      .filter(f => f.id !== target.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(f => getTargetText(f, targetLanguage));
    return shuffle([...distractors, correctText]);
  }, [frases, targetLanguage]);

  useEffect(() => {
    if (examState === 'active' && currentQuestion) {
      setShuffledOptions(generateOptions(currentQuestion));
      setSelectedOption(null);
    }
  }, [currentIndex, examState, currentQuestion, generateOptions]);

  const startExam = (limit: number = 10) => {
    const subset = shuffle([...frases]).slice(0, limit);
    setExamPhrases(subset);
    setCurrentIndex(0);
    setResults({ score: 0, total: limit, correctIds: [], incorrectIds: [] });
    setExamState('active');
  };

  const handleAnswer = (option: string) => {
    if (selectedOption) return;
    setSelectedOption(option);

    const correctText = getTargetText(currentQuestion, targetLanguage);
    const isCorrect = option === correctText;

    setTimeout(() => {
      if (isCorrect) {
        setResults(prev => ({
          ...prev,
          score: prev.score + 1,
          correctIds: [...prev.correctIds, String(currentQuestion.id)]
        }));

        if ((progress[currentQuestion.id] || 0) < 2) {
          advancePhraseProgress(String(currentQuestion.id));
        }
      } else {
        setResults(prev => ({
          ...prev,
          incorrectIds: [...prev.incorrectIds, String(currentQuestion.id)]
        }));
      }

      if (currentIndex < examPhrases.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        const finalScore = isCorrect ? results.score + 1 : results.score;
        recordExamResult(finalScore, examPhrases.length);
        setExamState('results');
      }
    }, 600);
  };

  const resetExam = () => setExamState('setup');

  return {
    examState,
    currentQuestion,
    currentIndex,
    totalQuestions: examPhrases.length,
    results,
    selectedOption,
    shuffledOptions,
    targetLanguage,
    frases, // Exponemos para el modal de errores
    actions: {
      startExam,
      handleAnswer,
      resetExam
    }
  };
}
