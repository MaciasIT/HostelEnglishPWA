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

type Question = {
  target: Phrase;
  options: string[];
};

export default function Quiz() {
  const { frases, loadFrases, frasesLoaded } = useAppStore();
  const phraseSettings = useAppStore((state) => state.prefs.phraseSettings);
  const setPhraseSetting = useAppStore((state) => state.setPhraseSetting);

  const [quizActive, setQuizActive] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [score, setScore] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean, message: string } | null>(null);

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

    // Seleccionar una frase objetivo
    const target = frases[Math.floor(Math.random() * frases.length)];

    // Seleccionar 3 distractores
    const distractors: string[] = [];
    while (distractors.length < 3) {
      const randomFrase = frases[Math.floor(Math.random() * frases.length)];
      if (randomFrase.id !== target.id && !distractors.includes(randomFrase.en)) {
        distractors.push(randomFrase.en);
      }
    }

    // Mezclar opciones
    const options = [...distractors, target.en].sort(() => Math.random() - 0.5);

    setCurrentQuestion({ target, options });
    setFeedback(null);
  }, [frases]);

  const handleStartQuiz = () => {
    setQuizActive(true);
    setScore(0);
    setTotalQuestions(0);
    generateQuestion();
  };

  const handleOptionSelect = (option: string) => {
    if (feedback || !currentQuestion) return;

    const isCorrect = option === currentQuestion.target.en;
    if (isCorrect) {
      setScore(s => s + 1);
      setFeedback({ isCorrect: true, message: '¡Correcto!' });
    } else {
      setFeedback({ isCorrect: false, message: `Incorrecto. Era: ${currentQuestion.target.en}` });
    }
    setTotalQuestions(t => t + 1);

    // Reproducir audio de la respuesta correcta
    playAudio(currentQuestion.target.en);
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
            <p className="text-xl mb-8">Pon a prueba tus conocimientos con nuestros quizzes interactivos.</p>
            <button
              onClick={handleStartQuiz}
              className="bg-accent hover:bg-accent-dark text-white font-bold py-3 px-8 rounded-full text-lg transition duration-300"
            >
              Comenzar Quiz
            </button>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-accent py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-12">¿Qué encontrarás aquí?</h2>
            <div className="grid md:grid-cols-1 gap-8">
              <FeatureCard
                title="Quizzes Desafiantes"
                description="Enfréntate a preguntas de opción múltiple, verdadero/falso y más para evaluar tu dominio del inglés para hostelería. ¡Obtén feedback instantáneo y mejora tus puntos débiles!"
              />
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
    <PageContainer title="Quiz Interactivo">
      <div className="max-w-2xl mx-auto">
        {/* Marcador */}
        <div className="flex justify-between items-center mb-6 bg-primary-dark p-4 rounded-lg">
          <p className="text-lg">Pregunta: <span className="font-bold">{totalQuestions + (feedback ? 0 : 1)}</span></p>
          <p className="text-lg">Puntuación: <span className="font-bold text-accent">{score} / {totalQuestions}</span></p>
        </div>

        {currentQuestion ? (
          <div className="bg-white/10 p-8 rounded-xl shadow-2xl backdrop-blur-sm border border-white/20">
            <h2 className="text-sm uppercase tracking-widest text-accent-light mb-2 font-bold">Traduce esta frase:</h2>
            <p data-testid="quiz-question" className="text-2xl sm:text-3xl font-bold mb-8 text-white italic">
              "{currentQuestion.target.es}"
            </p>

            <div className="grid grid-cols-1 gap-4">
              {currentQuestion.options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleOptionSelect(option)}
                  className={`quiz-option p-4 text-left rounded-lg transition-all duration-200 border-2 ${feedback
                      ? (option === currentQuestion.target.en
                        ? 'bg-green-500/50 border-green-400'
                        : (feedback.isCorrect ? 'bg-white/5 border-white/10' : 'bg-red-500/50 border-red-400'))
                      : 'bg-white/5 border-white/10 hover:bg-white/20 hover:border-accent'
                    } text-white font-medium`}
                  disabled={!!feedback}
                >
                  <span className="inline-block w-8 h-8 rounded-full bg-white/10 text-center leading-8 mr-3 text-sm">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  {option}
                </button>
              ))}
            </div>

            {feedback && (
              <div data-testid="quiz-feedback" className={`mt-8 p-4 rounded-lg text-center animate-bounce ${feedback.isCorrect ? 'bg-green-500' : 'bg-red-500'}`}>
                <p className="text-xl font-bold">{feedback.message}</p>
                <button
                  onClick={handleNextQuestion}
                  className="mt-4 bg-white text-primary font-bold py-2 px-6 rounded-full hover:bg-gray-100 transition duration-300"
                >
                  Siguiente pregunta
                </button>
              </div>
            )}
          </div>
        ) : (
          <p className="text-center">Cargando pregunta...</p>
        )}

        <div className="mt-8">
          <CollapsibleSection title="Ajustes de Voz">
            <VoiceSettings
              settings={phraseSettings}
              onSettingChange={setPhraseSetting}
              showTitle={false}
            />
          </CollapsibleSection>
        </div>

        <button
          onClick={() => setQuizActive(false)}
          className="mt-8 text-gray-400 hover:text-white transition duration-200 underline block mx-auto"
        >
          Volver a la introducción
        </button>
      </div>
    </PageContainer>
  );
}