import React, { useState, useEffect, useCallback } from 'react';
import { useAppStore, Phrase } from '@/store/useAppStore';
import PageContainer from '@/components/layout/PageContainer';
import CollapsibleSection from '@/components/CollapsibleSection';
import VoiceSettings from '@/components/VoiceSettings';
import ModuleIntro from '@/components/ModuleIntro';
import { AcademicCapIcon } from '@heroicons/react/24/outline';

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
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [score, setScore] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean, message: string } | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);

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
    if (frases.length < 4) return;

    const target = frases[Math.floor(Math.random() * frases.length)];
    const getTargetText = (f: Phrase) => (targetLanguage === 'eu' ? f.eu : f.en) || f.en;
    const targetText = getTargetText(target);

    if (selectedMode === 'multiple') {
      const distractors: string[] = [];
      while (distractors.length < 3) {
        const randomFrase = frases[Math.floor(Math.random() * frases.length)];
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
          randomFrase = frases[Math.floor(Math.random() * frases.length)];
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
  }, [frases, selectedMode, targetLanguage]);

  const handleStartQuiz = () => {
    setShowWelcome(false);
    setQuizActive(true);
    setScore(0);
    setTotalQuestions(0);
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
      setFeedback({ isCorrect: true, message: '¡Correcto!' });

      // Advance progress if correct
      if ((progress[currentQuestion.target.id] || 0) < 2) {
        advancePhraseProgress(String(currentQuestion.target.id));
      }
    } else {
      setFeedback({ isCorrect: false, message: `Incorrecto. Era: ${targetText}` });
    }
    setTotalQuestions(t => t + 1);
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
    return (
      <PageContainer title="Elige tu desafío">
        <div className="max-w-4xl mx-auto py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[
              { id: 'multiple', title: 'Opción Múltiple', desc: 'Elige la traducción correcta.', color: 'bg-blue-500' },
              { id: 'truefalse', title: 'Verdadero/Falso', desc: '¿Es correcta la traducción?', color: 'bg-purple-500' },
              { id: 'scramble', title: 'Ordenar Frase', desc: 'Reconstruye la frase original.', color: 'bg-orange-500' }
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => setSelectedMode(mode.id as QuizMode)}
                className={`p-8 rounded-3xl text-center border-2 transition-all transform hover:scale-105 ${selectedMode === mode.id ? 'bg-white/10 border-accent shadow-2xl' : 'bg-white/5 border-white/10'}`}
              >
                <div className={`w-12 h-12 ${mode.color} rounded-2xl mx-auto mb-4 flex items-center justify-center text-white font-black shadow-lg`}>
                  {mode.id === 'multiple' ? 'ABC' : mode.id === 'truefalse' ? '✓✗' : '...'}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{mode.title}</h3>
                <p className="text-sm text-gray-400">{mode.desc}</p>
              </button>
            ))}
          </div>

          <div className="flex justify-center">
            <button
              onClick={handleStartQuiz}
              className="bg-accent hover:brightness-110 text-white font-black py-5 px-16 rounded-2xl text-2xl shadow-2xl transform active:scale-95 transition-all"
            >
              COMENZAR DESAFÍO
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
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6 bg-white/5 border border-white/10 p-4 rounded-2xl shadow-lg backdrop-blur-md">
          <p className="text-lg font-bold">Pregunta <span className="text-accent">#{totalQuestions + (feedback ? 0 : 1)}</span></p>
          <div className="flex gap-4">
            <div className="bg-green-500/20 px-4 py-1 rounded-full border border-green-500/30">
              <p className="text-sm font-bold text-green-400">Puntos: {score}</p>
            </div>
            <div className="bg-accent/20 px-4 py-1 rounded-full border border-accent/30">
              <p className="text-sm font-bold text-accent">{totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0}%</p>
            </div>
          </div>
        </div>

        {currentQuestion ? (
          <div className="bg-white/10 p-8 rounded-3xl shadow-2xl backdrop-blur-xl border border-white/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-accent opacity-5 blur-3xl rounded-full"></div>

            <h2 className="text-[10px] uppercase tracking-[0.2em] text-accent font-black mb-6 flex items-center gap-2">
              <span className="w-6 h-[1px] bg-accent"></span>
              {selectedMode === 'truefalse' ? 'Identifica si es correcto' : 'Traduce al inglés'}
            </h2>

            <p data-testid="quiz-question" className="text-3xl sm:text-5xl font-black mb-12 text-white italic leading-[1.1]">
              "{currentQuestion.target.es}"
            </p>

            {selectedMode === 'multiple' && (
              <div className="grid grid-cols-1 gap-4">
                {currentQuestion.options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => checkAnswer(option)}
                    className={`p-6 text-left rounded-2xl transition-all duration-300 border-2 flex items-center ${feedback
                      ? (option === currentQuestion.target.en
                        ? 'bg-green-500 border-green-400 scale-[1.02] shadow-xl z-10'
                        : (feedback.isCorrect ? 'bg-white/5 border-white/10 opacity-30 scale-95' : 'bg-red-500 border-red-400'))
                      : 'bg-white/5 border-white/10 hover:bg-white/20 hover:border-accent active:scale-98'
                      } text-white text-lg font-bold`}
                    disabled={!!feedback}
                  >
                    <span className="w-10 h-10 rounded-xl bg-white/10 text-center leading-10 mr-5 text-sm font-black border border-white/20">
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

            {/* Feedback & Navigation */}
            {feedback && (
              <div data-testid="quiz-feedback" className={`mt-12 p-8 rounded-3xl text-center shadow-2xl border ${feedback.isCorrect ? 'bg-green-600/90 border-green-400' : 'bg-red-600/90 border-red-400'} animate-in slide-in-from-bottom-8 duration-500 backdrop-blur-xl`}>
                <p className="text-3xl font-black mb-2">{feedback.isCorrect ? '✨ ¡EXCELENTE! ✨' : '🤔 ¡Casi lo tienes!'}</p>
                <p className="text-xl opacity-90 mb-8 font-medium">
                  {feedback.isCorrect ? 'Respuesta perfecta.' : `Era: ${currentQuestion.target.en}`}
                </p>
                <button
                  onClick={handleNextQuestion}
                  className="bg-white text-primary font-black py-5 px-12 rounded-2xl hover:bg-accent hover:text-white transition-all duration-300 shadow-2xl active:scale-95 w-full uppercase tracking-widest"
                >
                  Siguiente Nivel
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-20">
            <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin shadow-2xl"></div>
            <p className="mt-6 text-gray-500 font-bold uppercase tracking-widest">Preparando el desafío...</p>
          </div>
        )}

        <button
          onClick={() => { setQuizActive(false); setShowWelcome(true); }}
          className="mt-12 text-gray-600 hover:text-white transition-all font-black uppercase tracking-tighter block mx-auto text-xs"
        >
          Abandonar práctica
        </button>
      </div>
    </PageContainer>
  );
}