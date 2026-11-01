import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAppStore, Phrase } from '@/store/useAppStore';
import { getTargetText } from '@/utils/language';
import { shuffle } from '@/utils/shuffle';
import { haptics } from '@/utils/haptics';
import type { Certification } from '@/store/types';
import { ExamQuestionResult, buildCertification } from '@/services/certificationCalculator';

export type ExamState = 'setup' | 'active' | 'results';

export type ExamResultsData = {
  score: number;
  total: number;
  correctIds: string[];
  incorrectIds: string[];
};

export type ExamConfig = {
  limit: number;
  role: string;
  studentName: string;
};

export function useExamLogic() {
  const {
    frases,
    progress,
    advancePhraseProgress,
    recordExamResult,
    frasesLoaded,
    loadFrases,
    targetLanguage,
  } = useAppStore(state => ({
    frases: state.frases,
    progress: state.progress,
    advancePhraseProgress: state.advancePhraseProgress,
    recordExamResult: state.recordExamResult,
    recordCertification: state.recordCertification,
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
  const [examConfig, setExamConfig] = useState<ExamConfig>({ limit: 10, role: '', studentName: '' });
  const [questionResults, setQuestionResults] = useState<ExamQuestionResult[]>([]);
  const [certification, setCertification] = useState<ReturnType<typeof buildCertification> | null>(null);
  const questionStartRef = useRef<number>(0);

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
      questionStartRef.current = Date.now();
    }
  }, [currentIndex, examState, currentQuestion, generateOptions]);

  const startExam = useCallback((config: ExamConfig) => {
    let subset = [...frases];

    if (config.role) {
      const roleKeywords: Record<string, string[]> = {
        recepcion: ['recepción', 'recepcion', 'check-in', 'check-out', 'reserva', 'booking', 'llegada', 'salida', 'habitación', 'room'],
        restaurante: ['restaurante', 'comida', 'cena', 'desayuno', 'menu', 'pedido', 'mesa', 'plato', 'bebida', 'cocina'],
        bar: ['bar', 'cafetería', 'cafeteria', 'cóctel', 'coctel', 'cafe', 'café', 'cerveza', 'vino', 'tapas'],
        limpieza: ['limpieza', 'habitación', 'room', 'piso', 'baño', 'toalla', 'aseo', 'detergente'],
        mantenimiento: ['mantenimiento', 'reparación', 'reparacion', 'luz', 'agua', 'avería', 'averia', 'herramienta'],
      };
      const keywords = roleKeywords[config.role] || [];
      subset = subset.filter(f => keywords.some(kw => (f.categoria || '').toLowerCase().includes(kw)));
    }

    // Fallback: if no matches, use all phrases
    if (subset.length < config.limit) {
      subset = [...frases];
    }

    const selected = shuffle(subset).slice(0, Math.min(config.limit, subset.length));
    setExamPhrases(selected);
    setCurrentIndex(0);
    setQuestionResults([]);
    setCertification(null);
    setResults({ score: 0, total: selected.length, correctIds: [], incorrectIds: [] });
    setExamConfig(config);
    setExamState('active');
  }, [frases]);

  const handleAnswer = useCallback((option: string) => {
    if (selectedOption) return;
    setSelectedOption(option);

    const responseTimeMs = Date.now() - questionStartRef.current;
    const correctText = getTargetText(currentQuestion!, targetLanguage);
    const isCorrect = option === correctText;

    setTimeout(() => {
      if (isCorrect) {
        haptics.trigger('SUCCESS');
        setResults(prev => ({
          ...prev,
          score: prev.score + 1,
          correctIds: [...prev.correctIds, String(currentQuestion!.id)]
        }));

        if ((progress[currentQuestion!.id] || 0) < 2) {
          advancePhraseProgress(String(currentQuestion!.id));
        }
      } else {
        // Fallo en examen: intento fallido menor (no hay vidas).
        haptics.trigger('WARNING');
        setResults(prev => ({
          ...prev,
          incorrectIds: [...prev.incorrectIds, String(currentQuestion!.id)]
        }));
      }

      setQuestionResults(prev => [...prev, {
        phraseId: String(currentQuestion!.id),
        category: currentQuestion!.categoria,
        correct: isCorrect,
        responseTimeMs: responseTimeMs,
      }]);

      if (currentIndex < examPhrases.length - 1) {
        setCurrentIndex(prev => prev + 1);
        questionStartRef.current = Date.now();
      } else {
        const finalScore = isCorrect ? results.score + 1 : results.score;
        recordExamResult(finalScore, examPhrases.length);

        // Build certification if role exam
        if (examConfig.role) {
          const allResults = [
            ...questionResults,
            {
              phraseId: String(currentQuestion!.id),
              category: currentQuestion!.categoria,
              correct: isCorrect,
              responseTimeMs: responseTimeMs,
            }
          ];
          const cert = buildCertification({
            studentName: examConfig.studentName || 'Estudiante',
            role: examConfig.role as Certification['role'],
            questionResults: allResults,
          });
          setCertification(cert);
          useAppStore.getState().recordCertification(cert);
        }

        setExamState('results');
      }
    }, 600);
  }, [selectedOption, currentQuestion, targetLanguage, progress, advancePhraseProgress, currentIndex, examPhrases.length, examConfig, questionResults, results, recordExamResult]);

  const resetExam = useCallback(() => {
    setExamState('setup');
    setCertification(null);
  }, []);

  return {
    examState,
    currentQuestion,
    currentIndex,
    totalQuestions: examPhrases.length,
    results,
    selectedOption,
    shuffledOptions,
    targetLanguage,
    frases,
    examConfig,
    certification,
    actions: {
      startExam,
      handleAnswer,
      resetExam
    }
  };
}
