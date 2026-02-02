import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppStore, Phrase } from '@/store/useAppStore';
import PageContainer from '@/components/layout/PageContainer';
import ModuleIntro from '@/components/ModuleIntro';
import {
  ClipboardDocumentCheckIcon,
  TrophyIcon,
  ShieldCheckIcon,
  SparklesIcon,
  FireIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { shuffle } from '@/utils/shuffle';
import { motion, AnimatePresence } from 'framer-motion';

type ExamResult = {
  score: number;
  total: number;
  correctIds: string[];
  incorrectIds: string[];
};

export default function Examen() {
  const { frases, progress, advancePhraseProgress, recordExamResult, frasesLoaded, loadFrases, targetLanguage } = useAppStore(state => ({
    frases: state.frases,
    progress: state.progress,
    advancePhraseProgress: state.advancePhraseProgress,
    recordExamResult: state.recordExamResult,
    frasesLoaded: state.frasesLoaded,
    loadFrases: state.loadFrases,
    targetLanguage: state.prefs.targetLanguage,
  }));
  const phraseSettings = useAppStore((state) => state.prefs.phraseSettings);

  const [showWelcome, setShowWelcome] = useState(true);
  const [examState, setExamState] = useState<'setup' | 'active' | 'results'>('setup');
  const [examPhrases, setExamPhrases] = useState<Phrase[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<ExamResult>({ score: 0, total: 0, correctIds: [], incorrectIds: [] });
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);
  const [showImprovementModal, setShowImprovementModal] = useState(false);

  useEffect(() => {
    if (!frasesLoaded) loadFrases();
  }, [frasesLoaded, loadFrases]);

  const getTargetText = (f: Phrase) => (targetLanguage === 'eu' ? f.eu : f.en) || f.en;

  const generateOptions = useCallback((target: Phrase) => {
    const targetText = getTargetText(target);
    const distractors = frases
      .filter(f => f.id !== target.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(f => getTargetText(f));
    return shuffle([...distractors, targetText]);
  }, [frases, targetLanguage]);

  useEffect(() => {
    if (examState === 'active' && examPhrases.length > 0) {
      setShuffledOptions(generateOptions(examPhrases[currentIndex]));
      setSelectedOption(null);
    }
  }, [currentIndex, examState, examPhrases, generateOptions]);

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

    const current = examPhrases[currentIndex];
    const targetText = getTargetText(current);
    const isCorrect = option === targetText;

    setTimeout(() => {
      if (isCorrect) {
        setResults(prev => ({
          ...prev,
          score: prev.score + 1,
          correctIds: [...prev.correctIds, String(current.id)]
        }));

        if ((progress[current.id] || 0) < 2) {
          advancePhraseProgress(String(current.id));
        }
      } else {
        setResults(prev => ({
          ...prev,
          incorrectIds: [...prev.incorrectIds, String(current.id)]
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

  if (showWelcome) {
    return (
      <PageContainer>
        <ModuleIntro
          title="Módulo de Examen"
          description="Certifica tus conocimientos. Completa el examen para validar lo que has aprendido y mejorar tu rango profesional."
          icon={ClipboardDocumentCheckIcon}
          onStart={() => setShowWelcome(false)}
          stats={[
            { label: 'Formato', value: 'Test' },
            { label: 'Exigencia', value: 'Alta' },
            { label: 'Premio', value: 'Insignia' }
          ]}
        />
      </PageContainer>
    );
  }

  if (examState === 'setup') {
    return (
      <PageContainer title="Configura tu Examen">
        <div className="max-w-2xl mx-auto py-12 text-center">
          <div className="bg-white/5 p-10 rounded-[3rem] border border-white/10 shadow-2xl backdrop-blur-xl mb-12">
            <ShieldCheckIcon className="w-16 h-16 text-accent mx-auto mb-6" />
            <h2 className="text-3xl font-black text-white mb-4">Examen Global</h2>
            <p className="text-gray-400 mb-8">
              Se te presentarán 10 frases aleatorias de todo el dataset ({targetLanguage === 'eu' ? 'euskera' : 'inglés'}).
              Debes acertar al menos el 80% para considerarlo superado.
            </p>
            <div className="space-y-4">
              <button
                onClick={() => startExam(10)}
                className="w-full bg-accent hover:brightness-110 text-white font-black py-4 rounded-2xl text-xl shadow-lg transition-all active:scale-95"
              >
                Comenzar Examen
              </button>
              <button
                onClick={() => setShowWelcome(true)}
                className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-2xl transition-all"
              >
                Volver
              </button>
            </div>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (examState === 'active') {
    const current = examPhrases[currentIndex];
    return (
      <PageContainer title={`Examen en progreso: ${currentIndex + 1}/${examPhrases.length}`}>
        <div className="max-w-2xl mx-auto">
          <div className="mb-8 h-2 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent transition-all duration-500"
              style={{ width: `${(currentIndex / examPhrases.length) * 100}%` }}
            ></div>
          </div>

          <div className="bg-white/10 p-10 rounded-[2.5rem] shadow-2xl border border-white/20 backdrop-blur-md">
            <p className="text-[10px] uppercase font-black text-accent tracking-widest mb-4">Traduce esta frase:</p>
            <h3 className="text-3xl sm:text-4xl font-black text-white mb-12 italic leading-tight">
              "{current.es}"
            </h3>

            <div className="grid grid-cols-1 gap-4">
              {shuffledOptions.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleAnswer(opt)}
                  className={`p-6 text-left rounded-2xl font-bold border-2 transition-all ${selectedOption === opt
                    ? (opt === getTargetText(current) ? 'bg-green-500 border-green-400' : 'bg-red-500 border-red-400')
                    : 'bg-white/5 border-white/10 hover:border-accent hover:bg-white/10'
                    } ${selectedOption && opt !== selectedOption && opt !== getTargetText(current) ? 'opacity-30' : ''}`}
                  disabled={!!selectedOption}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <p className="text-center mt-8 text-gray-500 text-xs uppercase tracking-widest font-bold">
            Pregunta #{currentIndex + 1}
          </p>
        </div>
      </PageContainer>
    );
  }

  if (examState === 'results') {
    const passed = results.score >= results.total * 0.8;
    return (
      <PageContainer title="Resultados del Examen">
        <div className="max-w-2xl mx-auto space-y-8">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`p-10 rounded-[3rem] border-2 shadow-2xl backdrop-blur-xl text-center relative overflow-hidden ${passed ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}
          >
            {passed && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-green-500/5 to-transparent"></div>
              </div>
            )}

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className={`w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl ${passed ? 'bg-green-500 animate-bounce' : 'bg-red-500'}`}
            >
              {passed ? <TrophyIcon className="w-14 h-14 text-white" /> : <ShieldCheckIcon className="w-14 h-14 text-white opacity-50" />}
            </motion.div>

            <motion.h2
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-5xl font-black text-white mb-2 tracking-tighter"
            >
              {passed ? '¡APROBADO!' : 'INTÉNTALO DE NUEVO'}
            </motion.h2>

            <motion.p
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-gray-400 mb-10 text-lg"
            >
              {passed
                ? '¡Increíble! Has demostrado un gran dominio de la lengua.'
                : 'Casi lo tienes. Un poco más de estudio y lo conseguirás.'}
            </motion.p>

            <div className="grid grid-cols-2 gap-4 mb-10">
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="bg-white/5 p-6 rounded-3xl border border-white/10"
              >
                <div className="flex items-center justify-center gap-2 mb-1">
                  <FireIcon className="w-4 h-4 text-orange-500" />
                  <p className="text-[10px] uppercase font-black text-gray-500 tracking-widest">Puntuación</p>
                </div>
                <p className="text-4xl font-black text-white">{results.score}<span className="text-lg text-gray-600 font-bold">/{results.total}</span></p>
              </motion.div>
              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="bg-white/5 p-6 rounded-3xl border border-white/10"
              >
                <div className="flex items-center justify-center gap-2 mb-1">
                  <SparklesIcon className="w-4 h-4 text-accent" />
                  <p className="text-[10px] uppercase font-black text-gray-500 tracking-widest">Precisión</p>
                </div>
                <p className="text-4xl font-black text-accent">{Math.round((results.score / results.total) * 100)}%</p>
              </motion.div>
            </div>

            <div className="flex flex-col gap-4">
              <button
                onClick={() => setExamState('setup')}
                className="bg-accent text-white font-black py-5 rounded-2xl text-xl shadow-2xl hover:brightness-110 active:scale-95 transition-all tracking-widest uppercase"
              >
                Comenzar Nuevo Examen
              </button>

              {results.incorrectIds.length > 0 && (
                <button
                  onClick={() => setShowImprovementModal(true)}
                  className="bg-red-500/20 text-red-400 font-bold py-4 rounded-2xl hover:bg-red-500/30 transition-all flex items-center justify-center gap-2 border border-red-500/20"
                >
                  <ShieldCheckIcon className="w-5 h-5" />
                  VER ERRORES ({results.incorrectIds.length})
                </button>
              )}

              <button
                onClick={() => setShowWelcome(true)}
                className="bg-white/5 text-white font-bold py-4 rounded-2xl hover:bg-white/10 active:scale-95 transition-all uppercase tracking-widest text-xs"
              >
                Volver al Menú Principal
              </button>
            </div>
          </motion.div>

          {/* Improvement Modal Overlay */}
          <AnimatePresence>
            {showImprovementModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-primary-dark/90 backdrop-blur-xl"
              >
                <motion.div
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.9, y: 20 }}
                  className="max-w-2xl w-full max-h-[80vh] bg-white/5 rounded-[3rem] border border-white/10 p-10 shadow-2xl overflow-y-auto flex flex-col"
                >
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-2xl font-black text-white flex items-center gap-3">
                      <ShieldCheckIcon className="w-8 h-8 text-red-500" />
                      Frases a Repasar
                    </h3>
                    <button
                      onClick={() => setShowImprovementModal(false)}
                      className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-all"
                    >
                      <XMarkIcon className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {results.incorrectIds.map(id => {
                      const p = frases.find(phrase => String(phrase.id) === id);
                      return p ? (
                        <div key={id} className="p-6 bg-black/40 rounded-2xl border border-white/5 group">
                          <p className="text-sm text-gray-500 italic mb-2">"{p.es}"</p>
                          <p className="text-white font-black text-lg tracking-tight">{getTargetText(p)}</p>
                        </div>
                      ) : null;
                    })}
                  </div>

                  <button
                    onClick={() => setShowImprovementModal(false)}
                    className="mt-8 w-full bg-white text-primary-dark font-black py-4 rounded-2xl shadow-xl hover:bg-accent hover:text-white transition-all uppercase tracking-widest"
                  >
                    Entendido
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </PageContainer>
    );
  }

  return null;
}