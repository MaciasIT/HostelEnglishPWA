import React, { useState, useEffect, useCallback } from 'react';
import { useAppStore, Phrase } from '@/store/useAppStore';
import { normalizeText } from '@/utils/normalize';
import useSpeechRecognition from '@/hooks/useSpeechRecognition';

const FeatureCard = ({ title, description }: { title: string, description: string }) => (
  <div className="bg-white/20 p-6 rounded-lg shadow-lg text-center">
    <h3 className="text-xl font-bold mb-2">{title}</h3>
    <p>{description}</p>
  </div>
);

const Dictation: React.FC = () => {
  const [showWelcome, setShowWelcome] = useState(true);
  const frases = useAppStore((state) => state.frases);
  const [currentPhrase, setCurrentPhrase] = useState<Phrase | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState('');

  const { isListening, transcript, startListening, stopListening, browserSupportsSpeechRecognition, error } = useSpeechRecognition();

  const selectNewPhrase = useCallback(() => {
    if (frases.length > 0) {
      const randomIndex = Math.floor(Math.random() * frases.length);
      setCurrentPhrase(frases[randomIndex]);
      setUserAnswer(''); // Reset answer
      setFeedback(''); // Reset feedback
    }
  }, [frases]);

  useEffect(() => {
    if (!showWelcome) {
      selectNewPhrase();
    }
  }, [showWelcome, selectNewPhrase]);

  const handlePlayAudio = () => {
    if (currentPhrase) {
      const utterance = new SpeechSynthesisUtterance(currentPhrase.en);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleCheckAnswer = () => {
    if (!currentPhrase) return;

    // Simple comparison for now
    if (normalizeText(userAnswer) === normalizeText(currentPhrase.en)) {
      setFeedback('¡Correcto!');
    } else {
      setFeedback('Inténtalo de nuevo.');
    }
  };

  if (showWelcome) {
    return (
      <div className="text-white">
        {/* Hero Section */}
        <section className="bg-primary py-20 px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="mb-4 text-4xl">✍️</div>
            <h1 className="text-5xl font-bold mb-4">Módulo de Dictado</h1>
            <p className="text-xl mb-8">Pon a prueba tu oído y escritura. Escucha frases en inglés y escríbelas correctamente.</p>
            <button
              onClick={() => {
                window.speechSynthesis.cancel();
                setShowWelcome(false);
              }}
              className="bg-accent hover:bg-accent-dark text-white font-bold py-3 px-8 rounded-full text-lg transition duration-300"
            >
              Empezar a Practicar
            </button>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-accent py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-12">¿Qué practicarás aquí?</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <FeatureCard
                title="Listening Activo"
                description="Agudiza tu oído para entender el inglés hablado en diferentes contextos y acentos."
              />
              <FeatureCard
                title="Escritura y Ortografía"
                description="Mejora tu precisión al escribir, prestando atención a la gramática y la ortografía."
              />
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-primary-dark py-4 text-center text-sm">
          <p>© 2025 HostellinglésApp. Todos los derechos reservados.</p>
        </footer>
      </div>
    );
  }

  // Main content of the dictation module
  return (
    <div className="p-4 text-white max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-4 text-center">Dictado: ¡A practicar!</h1>
      
      {currentPhrase ? (
        <div className="bg-primary-dark p-6 rounded-lg">
          <div className="flex items-center justify-center gap-4 mb-6">
            <p className="text-2xl text-center font-semibold text-accent-light">Escucha la frase</p>
            <button 
              aria-label="reproducir audio"
              onClick={handlePlayAudio}
              className="text-3xl hover:scale-110 transition-transform"
            >
              🔊
            </button>
          </div>

          <div className="space-y-4">
            <input
              type="text"
              value={isListening ? transcript : userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder={isListening ? "Escuchando..." : "Escribe lo que escuchas..."}
              className="w-full p-3 bg-primary border border-gray-600 rounded-lg text-white text-lg focus:outline-none focus:ring-2 focus:ring-accent"
              disabled={isListening}
            />
            <div className="flex gap-2">
              <button
                onClick={handleCheckAnswer}
                className="flex-grow bg-accent hover:bg-accent-dark text-white font-bold py-3 px-6 rounded-lg text-lg transition duration-300"
              >
                Comprobar
              </button>
              <button
                onClick={isListening ? stopListening : startListening}
                className={`p-3 rounded-lg text-lg transition duration-300 ${isListening ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}`}
                aria-label={isListening ? "detener dictado por voz" : "iniciar dictado por voz"}
                disabled={!browserSupportsSpeechRecognition}
              >
                {isListening ? '🔴' : '🎤'}
              </button>
            </div>
          </div>

          {error && <p className="mt-4 text-center text-red-400 text-lg">{error}</p>}
        </div>
      ) : (
        <p>Cargando frases...</p>
      )}

      <div className="mt-6 flex justify-center">
        <button 
          onClick={selectNewPhrase}
          className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-6 rounded-full transition duration-300"
        >
          Siguiente Frase
        </button>
      </div>
    </div>
  );
};

export default Dictation;