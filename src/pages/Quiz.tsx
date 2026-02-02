import React, { useState, useEffect, useCallback } from 'react';
import { useAppStore, Phrase } from '@/store/useAppStore';
import PageContainer from '@/components/layout/PageContainer';
import CollapsibleSection from '@/components/CollapsibleSection';
import VoiceSettings from '@/components/VoiceSettings';
import ModuleIntro from '@/components/ModuleIntro';
import {
  AcademicCapIcon,
  XMarkIcon,
  HeartIcon,
  FireIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

type QuizMode = 'multiple' | 'truefalse' | 'scramble';

type ScrambledWord = {
  id: string;
  text: string;
};

type Question = {
  target: Phrase;
  options: string[];
  tfTranslation?: string;
  tfIsCorrect?: boolean;
  scrambledWords?: ScrambledWord[];
};

export default function Quiz() {
  const { frases, loadFrases, frasesLoaded, progress, advancePhraseProgress } = useAppStore();
  const phraseSettings = useAppStore((state) => state.prefs.phraseSettings);
  const setPhraseSetting = useAppStore((state) => state.setPhraseSetting);

  const [quizActive, setQuizActive] = useState(false);
  const [selectedMode, setSelectedMode] = useState<QuizMode>('multiple');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [score, setScore] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean, message: string } | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);

  // Filtered phrases for the selected world
  const filteredFrases = selectedCategory
    ? frases.filter(f => f.categoria === selectedCategory)
    : frases;

  // New Gamification States
  const [lives, setLives] = useState(3);
  const [streak, setStreak] = useState(0);
  const [questionsHandledInLevel, setQuestionsHandledInLevel] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isLevelComplete, setIsLevelComplete] = useState(false);
  const QUESTIONS_PER_LEVEL = 10;

  const [scrambleAnswers, setScrambleAnswers] = useState<ScrambledWord[]>([]);

  useEffect(() => {
    if (!frasesLoaded) {
      loadFrases();
    }
  }, [frasesLoaded, loadFrases]);

  const targetLanguage = useAppStore((state) => state.prefs.targetLanguage);

  const playAudio = useCallback((text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = targetLanguage === 'eu' ? 'eu-ES' : 'en-US';
    utterance.rate = phraseSettings.rate;
    utterance.pitch = phraseSettings.pitch;

    if (phraseSettings.voiceURI) {
      const voice = window.speechSynthesis.getVoices().find(v => v.voiceURI === phraseSettings.voiceURI);
      if (voice && voice.lang.startsWith(targetLanguage === 'eu' ? 'eu' : 'en')) {
        utterance.voice = voice;
      }
    }

    window.speechSynthesis.speak(utterance);
  }, [phraseSettings, targetLanguage]);

  const generateQuestion = useCallback(() => {
    if (filteredFrases.length < 4) return;

    const target = filteredFrases[Math.floor(Math.random() * filteredFrases.length)];
    const getTargetText = (f: Phrase) => (targetLanguage === 'eu' ? f.eu : f.en) || f.en;
    const targetText = getTargetText(target);

    if (selectedMode === 'multiple') {
      const distractors: string[] = [];
      while (distractors.length < 3) {
        const randomFrase = filteredFrases[Math.floor(Math.random() * filteredFrases.length)];
        const distactorText = getTargetText(randomFrase);
        if (randomFrase.id !== target.id && !distractors.includes(distactorText)) {
          distractors.push(distactorText);
        }
      }
      const options = [...distractors, targetText].sort(() => Math.random() - 0.5);
      setCurrentQuestion({ target, options });
    } else if (selectedMode === 'truefalse') {
      const shouldBeCorrect = Math.random() > 0.5;
      let tfTranslation = targetText;
      if (!shouldBeCorrect) {
        let randomFrase;
        do {
          randomFrase = filteredFrases[Math.floor(Math.random() * filteredFrases.length)];
        } while (randomFrase.id === target.id);
        tfTranslation = getTargetText(randomFrase);
      }
      setCurrentQuestion({ target, options: [], tfTranslation, tfIsCorrect: shouldBeCorrect });
    } else if (selectedMode === 'scramble') {
      const words = targetText.split(' ');
      const scrambledWords = words.map((w, i) => ({ id: `${i}-${w}`, text: w })).sort(() => Math.random() - 0.5);
      setCurrentQuestion({ target, options: [], scrambledWords });
      setScrambleAnswers([]);
    }

    setFeedback(null);
  }, [filteredFrases, selectedMode, targetLanguage]);

  const handleStartQuiz = () => {
    setShowWelcome(false);
    setQuizActive(true);
    setScore(0);
    setTotalQuestions(0);
    setLives(3);
    setStreak(0);
    setQuestionsHandledInLevel(0);
    setIsGameOver(false);
    setIsLevelComplete(false);
    generateQuestion();
  };

  const checkAnswer = (answer: boolean | string) => {
    if (feedback || !currentQuestion) return;

    const targetText = (targetLanguage === 'eu' ? currentQuestion.target.eu : currentQuestion.target.en) || currentQuestion.target.en;

    let isCorrect = false;
    if (selectedMode === 'multiple') {
      isCorrect = answer === targetText;
    } else if (selectedMode === 'truefalse') {
      isCorrect = answer === currentQuestion.tfIsCorrect;
    } else if (selectedMode === 'scramble') {
      isCorrect = answer === targetText;
    }

    if (isCorrect) {
      setScore(s => s + 1);
      setStreak(s => s + 1);
      setFeedback({ isCorrect: true, message: '¡Correcto!' });

      // Advance progress if correct
      if ((progress[currentQuestion.target.id] || 0) < 2) {
        advancePhraseProgress(String(currentQuestion.target.id));
      }
    } else {
      const newLives = lives - 1;
      setLives(newLives);
      setStreak(0);
      setFeedback({ isCorrect: false, message: `Incorrecto. Era: ${targetText}` });
      if (newLives <= 0) {
        // We'll handle GameOver transition in handleNextQuestion
      }
    }
    setTotalQuestions(t => t + 1);
    setQuestionsHandledInLevel(q => q + 1);
    playAudio(targetText);
  };

  const handleScrambleClick = (word: ScrambledWord) => {
    if (feedback || !currentQuestion) return;
    setScrambleAnswers([...scrambleAnswers, word]);
  };

  const undoScramble = (word: ScrambledWord) => {
    if (feedback || !currentQuestion) return;
    setScrambleAnswers(scrambleAnswers.filter(w => w.id !== word.id));
  };

  const handleNextQuestion = () => {
    if (lives <= 0) {
      setIsGameOver(true);
      return;
    }
    if (questionsHandledInLevel >= QUESTIONS_PER_LEVEL) {
      setIsLevelComplete(true);
      return;
    }
    generateQuestion();
  };

  if (showWelcome) {
    return (
      <PageContainer>
        <ModuleIntro
          title="Módulo de Quiz"
          description="Desafía tu conocimiento con diferentes modos de juego. ¿Podrás acertar todas las preguntas?"
          icon={AcademicCapIcon}
          onStart={() => setShowWelcome(false)}
          stats={[
            { label: 'Modos', value: 3 },
            { label: 'Preguntas', value: frases.length },
            { label: 'Reto', value: 'Máximo' }
          ]}
        />
      </PageContainer>
    );
  }

  if (!quizActive) {
    const categoriesList = [...new Set(frases.map(f => f.categoria).filter(Boolean))] as string[];

    // Sort categories to keep them stable
    const sortedCategories = categoriesList.sort();

    return (
      <PageContainer title="Selecciona un Mundo">
        <div className="max-w-5xl mx-auto py-4">

          <div className="mb-12">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-6 px-2">1. Elige tu especialidad (Mundo)</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedCategories.map((cat) => {
                const catPhrases = frases.filter(f => f.categoria === cat);
                const masteredCount = catPhrases.filter(f => (progress[f.id] || 0) >= 2).length;
                const percent = Math.round((masteredCount / catPhrases.length) * 100);

                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`relative p-6 rounded-[2rem] text-left border-2 transition-all overflow-hidden group ${selectedCategory === cat ? 'bg-accent/10 border-accent shadow-xl' : 'bg-white/5 border-white/5 hover:border-white/20'}`}
                  >
                    <div className="relative z-10">
                      <h3 className="text-lg font-black text-white mb-1">{cat}</h3>
                      <p className="text-[10px] text-gray-500 font-bold uppercase mb-4">{catPhrases.length} Frases</p>

                      <div className="flex items-center gap-3">
                        <div className="flex-grow h-1.5 bg-black/40 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percent}%` }}
                            className="h-full bg-accent"
                          />
                        </div>
                        <span className="text-[10px] font-black text-accent">{percent}%</span>
                      </div>
                    </div>
                    {selectedCategory === cat && (
                      <div className="absolute top-4 right-4 text-accent">
                        <CheckCircleIcon className="w-5 h-5" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mb-12">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-6 px-2">2. Elige el modo de juego</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { id: 'multiple', title: 'Opción Múltiple', icon: 'ABC', color: 'bg-blue-500' },
                { id: 'truefalse', title: 'Verdadero/Falso', icon: '✓✗', color: 'bg-purple-500' },
                { id: 'scramble', title: 'Ordenar Frase', icon: '...', color: 'bg-orange-500' }
              ].map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setSelectedMode(mode.id as QuizMode)}
                  className={`p-6 rounded-[2rem] text-center border-2 transition-all ${selectedMode === mode.id ? 'bg-white/10 border-accent shadow-lg' : 'bg-white/5 border-white/5 hover:border-white/10'}`}
                >
                  <div className={`w-10 h-10 ${mode.color} rounded-xl mx-auto mb-3 flex items-center justify-center text-white font-black text-xs shadow-lg`}>
                    {mode.icon}
                  </div>
                  <h3 className="text-sm font-bold text-white tracking-tight">{mode.title}</h3>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-center pt-4">
            <button
              onClick={handleStartQuiz}
              disabled={!selectedCategory}
              className={`bg-accent hover:brightness-110 text-white font-black py-5 px-16 rounded-2xl text-xl shadow-2xl transform active:scale-95 transition-all tracking-widest flex items-center gap-3 ${!selectedCategory ? 'opacity-30 grayscale cursor-not-allowed' : ''}`}
            >
              <SparklesIcon className="w-6 h-6" />
              INICIAR DESAFÍO
            </button>
          </div>

          <div className="mt-16">
            <CollapsibleSection title="Personalización de Voz">
              <VoiceSettings
                settings={phraseSettings}
                onSettingChange={setPhraseSetting}
                showTitle={false}
              />
            </CollapsibleSection>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title={`Quiz: ${selectedMode === 'multiple' ? 'Opción Múltiple' : selectedMode === 'truefalse' ? 'Verdadero o Falso' : 'Ordenar Frase'}`}>
      <div className="max-w-xl mx-auto px-4">
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex justify-between items-center bg-white/5 border border-white/10 p-4 rounded-2xl shadow-lg backdrop-blur-md overflow-hidden relative">
            <button
              onClick={() => { setQuizActive(false); setShowWelcome(true); }}
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
            <div className="absolute bottom-0 left-0 h-1 bg-accent transition-all duration-500" style={{ width: `${(questionsHandledInLevel / QUESTIONS_PER_LEVEL) * 100}%` }}></div>
          </div>
        </div>

        {currentQuestion ? (
          <div className="bg-white/10 p-8 rounded-3xl shadow-2xl backdrop-blur-xl border border-white/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-accent opacity-5 blur-3xl rounded-full"></div>

            <h2 className="text-[10px] uppercase tracking-[0.2em] text-accent font-black mb-4 flex items-center gap-2">
              <span className="w-6 h-[1px] bg-accent"></span>
              {selectedMode === 'truefalse' ? 'Identifica si es correcto' : `Traduce al ${targetLanguage === 'eu' ? 'euskera' : 'inglés'}`}
            </h2>

            <p data-testid="quiz-question" className="text-2xl sm:text-3xl font-black mb-10 text-white italic leading-[1.1] text-center">
              "{currentQuestion.target.es}"
            </p>

            {selectedMode === 'multiple' && (
              <div className="grid grid-cols-1 gap-4">
                {currentQuestion.options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => checkAnswer(option)}
                    className={`p-5 text-left rounded-2xl transition-all duration-300 border-2 flex items-center ${feedback
                      ? (option === (targetLanguage === 'eu' ? currentQuestion.target.eu : currentQuestion.target.en)
                        ? 'bg-green-500 border-green-400 scale-[1.02] shadow-xl z-20'
                        : (feedback.isCorrect ? 'bg-white/5 border-white/10 opacity-30 scale-95' : 'bg-red-500 border-red-400'))
                      : 'bg-white/5 border-white/10 hover:bg-white/20 hover:border-accent active:scale-98'
                      } text-white text-base font-bold`}
                    disabled={!!feedback}
                  >
                    <span className="w-8 h-8 rounded-xl bg-white/10 text-center leading-8 mr-4 text-xs font-black border border-white/20">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    {option}
                  </button>
                ))}
              </div>
            )}

            {selectedMode === 'truefalse' && (
              <div className="space-y-10">
                <div className="p-8 bg-white/5 rounded-3xl border border-white/10 text-center shadow-inner">
                  <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">Traducción propuesta:</p>
                  <p className="text-3xl font-black text-white italic">"{currentQuestion.tfTranslation}"</p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <button
                    onClick={() => checkAnswer(true)}
                    className={`p-8 rounded-3xl font-black text-2xl transition-all border-2 shadow-lg ${feedback && currentQuestion.tfIsCorrect ? 'bg-green-500 border-green-400 scale-105' :
                      feedback && !currentQuestion.tfIsCorrect ? 'bg-gray-800 border-white/10 opacity-30' :
                        'bg-blue-600 border-blue-500 hover:brightness-110 active:scale-95'
                      }`}
                    disabled={!!feedback}
                  >
                    SÍ
                  </button>
                  <button
                    onClick={() => checkAnswer(false)}
                    className={`p-8 rounded-3xl font-black text-2xl transition-all border-2 shadow-lg ${feedback && !currentQuestion.tfIsCorrect ? 'bg-green-500 border-green-400 scale-105' :
                      feedback && currentQuestion.tfIsCorrect ? 'bg-gray-800 border-white/10 opacity-30' :
                        'bg-red-600 border-red-500 hover:brightness-110 active:scale-95'
                      }`}
                    disabled={!!feedback}
                  >
                    NO
                  </button>
                </div>
              </div>
            )}

            {selectedMode === 'scramble' && (
              <div className="space-y-8">
                {/* Answers Zone */}
                <div className="min-h-[120px] p-8 bg-black/20 rounded-3xl border-2 border-dashed border-white/10 flex flex-wrap gap-3 shadow-inner">
                  {scrambleAnswers.map((word, i) => (
                    <button
                      key={word.id}
                      onClick={() => undoScramble(word)}
                      className="px-5 py-3 bg-accent rounded-xl font-black text-white shadow-xl animate-in zoom-in-50 hover:bg-red-500 transition-colors"
                      disabled={!!feedback}
                    >
                      {word.text}
                    </button>
                  ))}
                  {scrambleAnswers.length === 0 && <p className="text-gray-600 italic text-center w-full mt-4">Toca las palabras para construir la frase</p>}
                </div>

                {/* Source Zone */}
                <div className="flex flex-wrap gap-3 justify-center pt-6">
                  {currentQuestion.scrambledWords?.map((word, i) => {
                    const isUsed = scrambleAnswers.some(w => w.id === word.id);

                    return (
                      <button
                        key={word.id}
                        onClick={() => handleScrambleClick(word)}
                        className={`px-5 py-3 bg-white/10 border border-white/10 rounded-xl font-black text-white hover:bg-white/20 active:scale-90 transition-all shadow-md ${isUsed ? 'opacity-0 scale-0 pointer-events-none' : ''}`}
                        disabled={!!feedback}
                      >
                        {word.text}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-8 flex flex-col items-center gap-4">
                  <button
                    onClick={() => checkAnswer(scrambleAnswers.map(w => w.text).join(' '))}
                    className={`px-12 py-4 bg-accent rounded-2xl font-black uppercase tracking-widest shadow-2xl transition-all hover:scale-105 active:scale-95 ${scrambleAnswers.length === 0 || !!feedback ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    Comprobar
                  </button>
                  <button
                    onClick={() => setScrambleAnswers([])}
                    className="text-xs text-gray-500 hover:text-white uppercase tracking-widest font-black transition-all"
                    disabled={!!feedback}
                  >
                    Resetear frase
                  </button>
                </div>
              </div>
            )}

            {/* Feedback Fixed Modal Overlay */}
            <AnimatePresence>
              {feedback && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-primary-dark/80 backdrop-blur-md"
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    className={`max-w-md w-full p-8 rounded-[2.5rem] text-center shadow-2xl border-2 ${feedback.isCorrect ? 'bg-green-600 border-green-400' : 'bg-red-600 border-red-400'}`}
                  >
                    <div className="mb-4">
                      {feedback.isCorrect ? (
                        <CheckCircleIcon className="w-16 h-16 text-white mx-auto animate-bounce" />
                      ) : (
                        <XMarkIcon className="w-16 h-16 text-white mx-auto" />
                      )}
                    </div>
                    <p className="text-2xl font-black mb-2">{feedback.isCorrect ? '¡MUY BIEN!' : '¡OUCH!'}</p>
                    <p className="text-lg opacity-90 mb-8 font-medium italic">
                      {feedback.isCorrect ? (streak > 2 ? `¡Racha de ${streak} aciertos! 🔥` : '¡Sigue así!') : `La respuesta correcta era: ${targetLanguage === 'eu' ? currentQuestion.target.eu : currentQuestion.target.en}`}
                    </p>
                    <button
                      onClick={handleNextQuestion}
                      className="bg-white text-primary-dark font-black py-4 px-12 rounded-2xl hover:bg-black hover:text-white transition-all shadow-2xl active:scale-95 w-full uppercase tracking-widest"
                    >
                      {lives <= 0 ? 'Ver Resultados' : (questionsHandledInLevel >= QUESTIONS_PER_LEVEL ? 'Ver Victoria' : 'Continuar')}
                    </button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Game Over Screen */}
            <AnimatePresence>
              {isGameOver && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-primary-dark/95 backdrop-blur-xl"
                >
                  <div className="max-w-md w-full p-10 bg-white/5 rounded-[3rem] border border-white/10 text-center shadow-2xl">
                    <div className="w-20 h-20 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                      <XMarkIcon className="w-12 h-12" />
                    </div>
                    <h2 className="text-4xl font-black text-white mb-2 tracking-tighter">FIN DEL JUEGO</h2>
                    <p className="text-gray-400 mb-8">¡No te rindas! La práctica hace al maestro.</p>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                      <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Puntos</p>
                        <p className="text-2xl font-black text-white">{score}</p>
                      </div>
                      <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Máxima Racha</p>
                        <p className="text-2xl font-black text-orange-500">{streak}</p>
                      </div>
                    </div>

                    <button
                      onClick={handleStartQuiz}
                      className="w-full bg-accent text-white font-black py-5 rounded-2xl shadow-xl flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all"
                    >
                      <ArrowPathIcon className="w-6 h-6" />
                      REINTENTAR
                    </button>
                    <button
                      onClick={() => { setQuizActive(false); setShowWelcome(true); }}
                      className="w-full mt-4 text-gray-500 font-bold py-3 hover:text-white transition-all"
                    >
                      SALIR AL MENÚ
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Level Complete / Victory Screen */}
            <AnimatePresence>
              {isLevelComplete && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-primary-dark/95 backdrop-blur-xl"
                >
                  <div className="max-w-md w-full p-10 bg-white/5 rounded-[3rem] border border-white/10 text-center shadow-2xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-accent/5 pointer-events-none"></div>
                    <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                      <SparklesIcon className="w-12 h-12" />
                    </div>
                    <h2 className="text-4xl font-black text-white mb-2 tracking-tighter">¡MISIÓN CUMPLIDA!</h2>
                    <p className="text-gray-400 mb-8">Has completado el set de {QUESTIONS_PER_LEVEL} preguntas con éxito.</p>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                      <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Puntos</p>
                        <p className="text-2xl font-black text-white">{score} / {totalQuestions}</p>
                      </div>
                      <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Vidas Restantes</p>
                        <p className="text-2xl font-black text-red-500">{lives}</p>
                      </div>
                    </div>

                    <button
                      onClick={handleStartQuiz}
                      className="w-full bg-green-600 text-white font-black py-5 rounded-2xl shadow-xl flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all"
                    >
                      SIGUIENTE NIVEL
                    </button>
                    <button
                      onClick={() => { setQuizActive(false); setShowWelcome(true); }}
                      className="w-full mt-4 text-gray-500 font-bold py-3 hover:text-white transition-all"
                    >
                      VER OTROS MODOS
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-20">
            <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin shadow-2xl"></div>
            <p className="mt-6 text-gray-500 font-bold uppercase tracking-widest">Preparando el desafío...</p>
          </div>
        )}


      </div>
    </PageContainer>
  );
}