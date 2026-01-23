import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppStore, Phrase } from '@/store/useAppStore';
import PageContainer from '@/components/layout/PageContainer';
import ModuleIntro from '@/components/ModuleIntro';
import { ClipboardDocumentCheckIcon, TrophyIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { shuffle } from '@/utils/shuffle';

type ExamResult = {
  score: number;
  total: number;
  correctIds: string[];
  incorrectIds: string[];
};

export default function Examen() {
  const { frases, progress, advancePhraseProgress, frasesLoaded, loadFrases, targetLanguage } = useAppStore(state => ({
    frases: state.frases,
    progress: state.progress,
    advancePhraseProgress: state.advancePhraseProgress,
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
              Se te presentarán 10 frases aleatorias de todo el dataset.
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
        <div className="max-w-2xl mx-auto text-center space-y-8 animate-fade-in">
          <div className={`p-10 rounded-[3rem] border shadow-2xl backdrop-blur-xl ${passed ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${passed ? 'bg-green-500' : 'bg-red-500'}`}>
              {passed ? <TrophyIcon className="w-12 h-12 text-white" /> : <ShieldCheckIcon className="w-12 h-12 text-white opacity-50" />}
            </div>
            <h2 className="text-4xl font-black text-white mb-2">
              {passed ? (targetLanguage === 'eu' ? 'GAINDITUA!' : '¡APROBADO!') : (targetLanguage === 'eu' ? 'EZ GAINDITUA' : 'NO SUPERADO')}
            </h2>
            <p className="text-gray-400 mb-8">
              {targetLanguage === 'eu' ? (
                <>Zuk <span className="text-white font-bold">{results.score}</span> asmatu dituzu <span className="text-white font-bold">{results.total}</span> galderatik.</>
              ) : (
                <>Has acertado <span className="text-white font-bold">{results.score}</span> de <span className="text-white font-bold">{results.total}</span> preguntas.</>
              )}
            </p>

            <div className="flex justify-center gap-4 mb-8">
              <div className="bg-white/5 p-4 rounded-2xl border border-white/10 w-32">
                <p className="text-[10px] uppercase font-bold text-gray-500">{targetLanguage === 'eu' ? 'Zuzenak' : 'Correctas'}</p>
                <p className="text-2xl font-black text-green-500">{results.score}</p>
              </div>
              <div className="bg-white/5 p-4 rounded-2xl border border-white/10 w-32">
                <p className="text-[10px] uppercase font-bold text-gray-500">{targetLanguage === 'eu' ? 'Nota' : 'Nota'}</p>
                <p className="text-2xl font-black text-accent">{Math.round((results.score / results.total) * 100)}%</p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => setExamState('setup')}
                className="bg-accent text-white font-black py-4 rounded-2xl text-lg shadow-lg hover:brightness-110"
              >
                {targetLanguage === 'eu' ? 'Berriro Saiatu' : 'Intentar de Nuevo'}
              </button>
              <button
                onClick={() => setShowWelcome(true)}
                className="bg-white/5 text-white font-bold py-3 rounded-2xl hover:bg-white/10"
              >
                {targetLanguage === 'eu' ? 'Hasierara Itzuli' : 'Volver al Inicio'}
              </button>
            </div>
          </div>

          {results.incorrectIds.length > 0 && (
            <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10 text-left">
              <h3 className="text-lg font-bold text-white mb-4">{targetLanguage === 'eu' ? 'Kontzeptu hauek errepasatu:' : 'Repasa estos conceptos:'}</h3>
              <div className="space-y-4">
                {results.incorrectIds.map(id => {
                  const p = frases.find(f => f.id === id);
                  return p ? (
                    <div key={id} className="p-4 bg-red-500/5 rounded-xl border border-red-500/10">
                      <p className="text-sm text-gray-400 italic mb-1">"{p.es}"</p>
                      <p className="text-white font-bold">{getTargetText(p)}</p>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </div>
      </PageContainer>
    );
  }

  return null;
}