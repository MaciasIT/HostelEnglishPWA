import React, { useState, useEffect, useCallback } from 'react';
import { useAppStore, Phrase } from '@/store/useAppStore';
import PageContainer from '@/components/layout/PageContainer';
import CollapsibleSection from '@/components/CollapsibleSection';
import VoiceSettings from '@/components/VoiceSettings';

const FeatureCard = ({ title, description }: { title: string, description: string }) => (
  <div className="bg-white/20 p-6 rounded-lg shadow-lg text-center">
    <h3 className="text-xl font-bold mb-2">{title}</h3>
    <p>{description}</p>
  </div>
);

type QuizMode = 'multiple' | 'truefalse' | 'scramble';

type Question = {
  target: Phrase;
  options: string[]; // For multiple choice
  tfTranslation?: string; // For true/false
  tfIsCorrect?: boolean; // For true/false
  scrambledWords?: string[]; // For scramble
};

export default function Quiz() {
  const { frases, loadFrases, frasesLoaded } = useAppStore();
  const phraseSettings = useAppStore((state) => state.prefs.phraseSettings);
  const setPhraseSetting = useAppStore((state) => state.setPhraseSetting);

  const [quizActive, setQuizActive] = useState(false);
  const [selectedMode, setSelectedMode] = useState<QuizMode>('multiple');
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [score, setScore] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean, message: string } | null>(null);

  // For scramble mode
  const [scrambleAnswers, setScrambleAnswers] = useState<string[]>([]);

  useEffect(() => {
    if (!frasesLoaded) {
      loadFrases();
    }
  }, [frasesLoaded, loadFrases]);

  const playAudio = useCallback((text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = phraseSettings.rate;
    utterance.pitch = phraseSettings.pitch;

    if (phraseSettings.voiceURI) {
      const voice = window.speechSynthesis.getVoices().find(v => v.voiceURI === phraseSettings.voiceURI);
      if (voice) utterance.voice = voice;
    }

    window.speechSynthesis.speak(utterance);
  }, [phraseSettings]);

  const generateQuestion = useCallback(() => {
    if (frases.length < 4) return;

    const target = frases[Math.floor(Math.random() * frases.length)];

    if (selectedMode === 'multiple') {
      const distractors: string[] = [];
      while (distractors.length < 3) {
        const randomFrase = frases[Math.floor(Math.random() * frases.length)];
        if (randomFrase.id !== target.id && !distractors.includes(randomFrase.en)) {
          distractors.push(randomFrase.en);
        }
      }
      const options = [...distractors, target.en].sort(() => Math.random() - 0.5);
      setCurrentQuestion({ target, options });
    } else if (selectedMode === 'truefalse') {
      const shouldBeCorrect = Math.random() > 0.5;
      let tfTranslation = target.en;
      if (!shouldBeCorrect) {
        let randomFrase;
        do {
          randomFrase = frases[Math.floor(Math.random() * frases.length)];
        } while (randomFrase.id === target.id);
        tfTranslation = randomFrase.en;
      }
      setCurrentQuestion({ target, options: [], tfTranslation, tfIsCorrect: shouldBeCorrect });
    } else if (selectedMode === 'scramble') {
      const words = target.en.split(' ');
      const scrambledWords = [...words].sort(() => Math.random() - 0.5);
      setCurrentQuestion({ target, options: [], scrambledWords });
      setScrambleAnswers([]);
    }

    setFeedback(null);
  }, [frases, selectedMode]);

  const handleStartQuiz = () => {
    setQuizActive(true);
    setScore(0);
    setTotalQuestions(0);
    generateQuestion();
  };

  const checkAnswer = (answer: boolean | string) => {
    if (feedback || !currentQuestion) return;

    let isCorrect = false;
    if (selectedMode === 'multiple') {
      isCorrect = answer === currentQuestion.target.en;
    } else if (selectedMode === 'truefalse') {
      isCorrect = answer === currentQuestion.tfIsCorrect;
    } else if (selectedMode === 'scramble') {
      isCorrect = answer === currentQuestion.target.en;
    }

    if (isCorrect) {
      setScore(s => s + 1);
      setFeedback({ isCorrect: true, message: '¡Correcto!' });
    } else {
      const correctText = currentQuestion.target.en;
      setFeedback({ isCorrect: false, message: `Incorrecto. Era: ${correctText}` });
    }
    setTotalQuestions(t => t + 1);
    playAudio(currentQuestion.target.en);
  };

  const handleScrambleClick = (word: string, index: number) => {
    if (feedback || !currentQuestion) return;

    // Remove from scrambled, add to answers
    const newAnswers = [...scrambleAnswers, word];
    setScrambleAnswers(newAnswers);

    const remainingWords = currentQuestion.scrambledWords?.filter((_, i) => {
      // This logic is slightly flawed for duplicate words, let's fix
      return true;
    });
    // Simplified: we'll just track used indices
  };

  const handleNextQuestion = () => {
    generateQuestion();
  };

  if (!quizActive) {
    return (
      <div className="text-white">
        {/* Hero Section */}
        <section className="bg-primary py-20 px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <img src={`${import.meta.env.BASE_URL}icons/icono.png`} alt="HostelEnglish Logo" className="mx-auto mb-4 w-32 h-32" />
            <h1 className="text-5xl font-bold mb-4">Módulo de Quiz</h1>
            <p className="text-xl mb-8 font-light">¿Listo para poner a prueba tu nivel?</p>

            <div className="mb-10 max-w-md mx-auto">
              <p className="mb-4 text-lg font-semibold border-b border-white/20 pb-2">Selecciona un modo:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => setSelectedMode('multiple')}
                  className={`p-3 rounded-lg border-2 transition-all ${selectedMode === 'multiple' ? 'bg-accent border-accent' : 'bg-primary-dark border-primary-light hover:border-accent'}`}
                >
                  Opción Múltiple
                </button>
                <button
                  onClick={() => setSelectedMode('truefalse')}
                  className={`p-3 rounded-lg border-2 transition-all ${selectedMode === 'truefalse' ? 'bg-accent border-accent' : 'bg-primary-dark border-primary-light hover:border-accent'}`}
                >
                  Verdadero o Falso
                </button>
                <button
                  onClick={() => setSelectedMode('scramble')}
                  className={`p-3 rounded-lg border-2 transition-all col-span-1 sm:col-span-2 ${selectedMode === 'scramble' ? 'bg-accent border-accent' : 'bg-primary-dark border-primary-light hover:border-accent'}`}
                >
                  Ordenar Frase (Scramble)
                </button>
              </div>
            </div>

            <button
              onClick={handleStartQuiz}
              className="bg-white text-primary hover:bg-accent hover:text-white font-bold py-4 px-12 rounded-full text-xl transition-all duration-300 transform hover:scale-105 shadow-xl"
            >
              Comenzar Quiz
            </button>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-accent py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-12">Desafía tu aprendizaje</h2>
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <FeatureCard title="Opción Múltiple" description="Elige la traducción correcta entre varias opciones." />
              <FeatureCard title="Verdadero o Falso" description="Decide si la traducción mostrada es correcta." />
              <FeatureCard title="Estructura (Scramble)" description="Ordena las palabras para formar la frase perfecta." />
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-primary-dark py-4 text-center text-sm">
          <p>© {new Date().getFullYear()} HostellinglésApp. Todos los derechos reservados.</p>
        </footer>
      </div>
    );
  }

  return (
    <PageContainer title={`Quiz: ${selectedMode === 'multiple' ? 'Opción Múltiple' : selectedMode === 'truefalse' ? 'Verdadero o Falso' : 'Ordenar Frase'}`}>
      <div className="max-w-2xl mx-auto">
        {/* Marcador */}
        <div className="flex justify-between items-center mb-6 bg-primary-dark border border-white/10 p-4 rounded-xl shadow-lg">
          <p className="text-lg">Pregunta <span className="font-bold text-accent">#{totalQuestions + (feedback ? 0 : 1)}</span></p>
          <div className="bg-white/10 px-4 py-1 rounded-full">
            <p className="text-lg">Eficiencia: <span className="font-bold text-accent">{totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0}%</span></p>
          </div>
        </div>

        {currentQuestion ? (
          <div className="bg-white/10 p-8 rounded-2xl shadow-2xl backdrop-blur-md border border-white/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent opacity-5 blur-3xl rounded-full"></div>

            <h2 className="text-xs uppercase tracking-widest text-accent font-black mb-4 flex items-center gap-2">
              <span className="w-4 h-[2px] bg-accent"></span>
              {selectedMode === 'truefalse' ? '¿Es esta traducción correcta?' : 'Traduce esta frase:'}
            </h2>

            <p data-testid="quiz-question" className="text-2xl sm:text-4xl font-bold mb-10 text-white italic leading-tight">
              "{currentQuestion.target.es}"
            </p>

            {/* Game Mode UI */}
            {selectedMode === 'multiple' && (
              <div className="grid grid-cols-1 gap-4">
                {currentQuestion.options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => checkAnswer(option)}
                    className={`quiz-option p-5 text-left rounded-xl transition-all duration-300 border-2 flex items-center ${feedback
                        ? (option === currentQuestion.target.en
                          ? 'bg-green-500 border-green-400'
                          : (feedback.isCorrect ? 'bg-white/5 border-white/10 opacity-50' : 'bg-red-500 border-red-400'))
                        : 'bg-white/5 border-white/10 hover:bg-white/20 hover:border-accent active:scale-95'
                      } text-white text-lg font-medium`}
                    disabled={!!feedback}
                  >
                    <span className="w-8 h-8 rounded-lg bg-white/10 text-center leading-8 mr-4 text-xs font-bold border border-white/20">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    {option}
                  </button>
                ))}
              </div>
            )}

            {selectedMode === 'truefalse' && (
              <div className="space-y-8">
                <div className="p-6 bg-white/5 rounded-xl border border-white/10 text-center">
                  <p className="text-xl sm:text-3xl text-accent font-bold mb-1">En inglés:</p>
                  <p className="text-2xl sm:text-3xl font-light text-white">{currentQuestion.tfTranslation}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => checkAnswer(true)}
                    className={`p-6 rounded-xl font-bold text-xl transition-all border-2 ${feedback && currentQuestion.tfIsCorrect ? 'bg-green-500 border-green-400' :
                        feedback && !currentQuestion.tfIsCorrect ? 'bg-gray-700 border-gray-600 opacity-50' :
                          'bg-blue-600 border-blue-500 hover:bg-blue-500 active:scale-95'
                      }`}
                    disabled={!!feedback}
                  >
                    Verdadero
                  </button>
                  <button
                    onClick={() => checkAnswer(false)}
                    className={`p-6 rounded-xl font-bold text-xl transition-all border-2 ${feedback && !currentQuestion.tfIsCorrect ? 'bg-green-500 border-green-400' :
                        feedback && currentQuestion.tfIsCorrect ? 'bg-gray-700 border-gray-600 opacity-50' :
                          'bg-red-600 border-red-500 hover:bg-red-500 active:scale-95'
                      }`}
                    disabled={!!feedback}
                  >
                    Falso
                  </button>
                </div>
              </div>
            )}

            {selectedMode === 'scramble' && (
              <div className="space-y-6">
                {/* Answers Zone */}
                <div className="min-h-[100px] p-6 bg-white/5 rounded-xl border-2 border-dashed border-white/20 flex flex-wrap gap-2">
                  {scrambleAnswers.map((word, i) => (
                    <span key={i} className="px-4 py-2 bg-accent rounded-lg font-bold text-white shadow-lg animate-in zoom-in-50">
                      {word}
                    </span>
                  ))}
                  {scrambleAnswers.length === 0 && <p className="text-gray-500 italic mt-2">Toca las palabras para construir la frase...</p>}
                </div>

                {/* Source Zone */}
                <div className="flex flex-wrap gap-2 justify-center pt-4">
                  {currentQuestion.scrambledWords?.map((word, i) => {
                    const isUsed = scrambleAnswers.filter(w => w === word).length >
                      scrambleAnswers.slice(0, scrambleAnswers.findIndex(w => w === word && scrambleAnswers[scrambleAnswers.indexOf(w)] === word)).length;
                    // Simplificación rápida para scramble: ocultar manualmente el botón si ya está en answers
                    // Para hacerlo robusto usaríamos IDs únicos por cada palabra, pero esto vale para una PWA ligera.
                    const countInAnswers = scrambleAnswers.filter(w => w === word).length;
                    const countInInitial = currentQuestion.scrambledWords?.filter(w => w === word).length || 0;
                    const occurrencesBefore = currentQuestion.scrambledWords?.slice(0, i).filter(w => w === word).length || 0;
                    const shouldHide = occurrencesBefore < countInAnswers;

                    return (
                      <button
                        key={i}
                        onClick={() => handleScrambleClick(word, i)}
                        className={`px-4 py-2 bg-primary-dark border border-white/20 rounded-lg font-bold text-white hover:bg-white/10 active:scale-90 transition-all ${shouldHide ? 'opacity-0 scale-0 pointer-events-none' : ''}`}
                        disabled={!!feedback}
                      >
                        {word}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-4 flex justify-center">
                  <button
                    onClick={() => checkAnswer(scrambleAnswers.join(' '))}
                    className={`px-8 py-3 bg-accent rounded-full font-black uppercase tracking-widest shadow-xl transition-all hover:scale-105 active:scale-95 ${scrambleAnswers.length === 0 || !!feedback ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    Comprobar
                  </button>
                  <button
                    onClick={() => setScrambleAnswers([])}
                    className="ml-4 text-xs text-gray-400 hover:text-white underline"
                    disabled={!!feedback}
                  >
                    Reiniciar frase
                  </button>
                </div>
              </div>
            )}

            {/* Feedback & Navigation */}
            {feedback && (
              <div data-testid="quiz-feedback" className={`mt-10 p-6 rounded-2xl text-center shadow-inner ${feedback.isCorrect ? 'bg-green-600/90' : 'bg-red-600/90'} animate-in slide-in-from-bottom-4 duration-300`}>
                <p className="text-2xl font-black mb-1">{feedback.isCorrect ? '🔥 ¡Sigue así! 🔥' : '😅 Casi...'}</p>
                <p className="text-lg opacity-90 mb-4 font-light">{feedback.message}</p>
                <div className="flex justify-center flex-col items-center gap-2">
                  <button
                    onClick={handleNextQuestion}
                    className="bg-white text-primary font-black py-4 px-10 rounded-full hover:bg-accent hover:text-white transition-all duration-300 shadow-xl"
                  >
                    Siguiente desafío
                  </button>
                  <p className="text-[10px] text-white/50 uppercase tracking-widest mt-2">Pulsa siguiente para continuar</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-20">
            <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-400">Generando tu próximo desafío...</p>
          </div>
        )}

        <div className="mt-12">
          <CollapsibleSection title="Personalización de Voz">
            <VoiceSettings
              settings={phraseSettings}
              onSettingChange={setPhraseSetting}
              showTitle={false}
            />
          </CollapsibleSection>
        </div>

        <button
          onClick={() => setQuizActive(false)}
          className="mt-10 text-gray-500 hover:text-white transition-all underline block mx-auto text-sm"
        >
          Abandonar práctica
        </button>
      </div>
    </PageContainer>
  );
}