import React, { useState, useEffect, useCallback } from 'react';
import { normalizeText, levenshteinDistance } from '@/utils/normalize';
import useSpeechRecognition from '@/hooks/useSpeechRecognition';
import VoiceSettings from '@/components/VoiceSettings';
import useAudioControl from '@/hooks/useAudioControl'; // Use the new hook
import { useAppStore, Phrase } from '../store/useAppStore';

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
  const [correctAnswer, setCorrectAnswer] = useState<string | null>(null); // New state for correct answer
  const [showTranslation, setShowTranslation] = useState(false); // State to control translation visibility

  const { isListening, transcript, startListening, stopListening, browserSupportsSpeechRecognition, error: speechError, requestingPermission } = useSpeechRecognition();
  const { cancelSpeech } = useAudioControl(); // Use the new hook

  const phraseSettings = useAppStore((state) => state.prefs.phraseSettings);
  const setPhraseSetting = useAppStore((state) => state.setPhraseSetting);

  const selectNewPhrase = useCallback(() => {
    if (frases.length > 0) {
      const randomIndex = Math.floor(Math.random() * frases.length);
      setCurrentPhrase(frases[randomIndex]);
      setUserAnswer(''); // Reset answer
      setFeedback(''); // Reset feedback
      setCorrectAnswer(null); // Reset correct answer
      setShowTranslation(false); // Hide translation for new phrase
    }
  }, [frases]);

  useEffect(() => {
    if (!showWelcome) {
      selectNewPhrase();
    }
  }, [showWelcome, selectNewPhrase]);

  const handlePlayAudio = () => {
    if (currentPhrase) {
      cancelSpeech(); // Cancel any ongoing speech before playing new audio
      const utterance = new SpeechSynthesisUtterance(currentPhrase.en);
      utterance.rate = phraseSettings.rate;
      utterance.pitch = phraseSettings.pitch;

      const voices = window.speechSynthesis.getVoices();
      const selectedVoice = voices.find(voice => voice.voiceURI === phraseSettings.voiceURI);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      window.speechSynthesis.speak(utterance);
    }
  };

  const handleCheckAnswer = useCallback(() => {
    if (!currentPhrase) return;

    cancelSpeech(); // Cancel speech on check

    const normalizedUserAnswer = normalizeText(userAnswer);
    const normalizedCorrectAnswer = normalizeText(currentPhrase.en);

    const distance = levenshteinDistance(normalizedUserAnswer, normalizedCorrectAnswer);
    const toleranceThreshold = Math.floor(normalizedCorrectAnswer.length * 0.15); // 15% tolerance

    if (distance <= toleranceThreshold) {
      setFeedback('¡Correcto!');
      setCorrectAnswer(null); // Clear correct answer on success
      setShowTranslation(true); // Show translation on correct answer
    } else {
      setFeedback('Inténtalo de nuevo.');
      setCorrectAnswer(currentPhrase.en); // Show correct answer on failure
      setShowTranslation(true); // Show translation on incorrect answer
    }
  }, [currentPhrase, userAnswer, cancelSpeech]);

  // Effect to handle speech recognition transcript
  useEffect(() => {
    if (!isListening && transcript) {
      setUserAnswer(transcript);
      // Automatically check the answer after speech recognition stops and a transcript is available
      handleCheckAnswer();
    }
  }, [isListening, transcript, handleCheckAnswer]);

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
                cancelSpeech(); // Use cancelSpeech from the hook
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
              onChange={(e) => { cancelSpeech(); setUserAnswer(e.target.value); }}
              placeholder={isListening ? "Escuchando..." : "Escribe lo que escuchas..."}
              className="w-full p-3 bg-primary border border-gray-600 rounded-lg text-white text-lg focus:outline-none focus:ring-2 focus:ring-accent"
              disabled={isListening}
            />
            <div className="flex gap-2">
              <button
                onClick={() => { cancelSpeech(); handleCheckAnswer(); }}
                className="flex-grow bg-accent hover:bg-accent-dark text-white font-bold py-3 px-6 rounded-lg text-lg transition duration-300"
              >
                Comprobar
              </button>
              <button
                onClick={() => { cancelSpeech(); isListening ? stopListening() : startListening(); }}
                className={`p-3 rounded-lg text-lg transition duration-300 ${isListening ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}`}
                aria-label={isListening ? "detener dictado por voz" : "iniciar dictado por voz"}
                disabled={!browserSupportsSpeechRecognition}
              >
                {isListening ? '🔴' : '🎤'}
              </button>
              <button
                onClick={() => {
                  cancelSpeech();
                  handleCheckAnswer();
                }}
                className="flex-grow bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg text-lg transition duration-300"
                aria-label="enviar respuesta por voz"
              >
                Enviar Respuesta
              </button>
            </div>
          </div>

          {!browserSupportsSpeechRecognition && (
            <p className="mt-4 text-center text-red-400 text-lg">
              Tu navegador no soporta el reconocimiento de voz. Por favor, usa Chrome o Edge.
            </p>
          )}
          {speechError && <p className="mt-4 text-center text-red-400 text-lg">Error de voz: {speechError}</p>}
          {requestingPermission && (
            <p className="mt-4 text-center text-yellow-400 text-lg">
              Solicitando permisos para usar el micrófono...
            </p>
          )}
          {feedback && (
            <p className={`mt-4 text-center text-xl font-bold ${feedback === '¡Correcto!' ? 'text-green-400' : 'text-red-400'}`}>
              {feedback}
            </p>
          )}
          {correctAnswer && feedback === 'Inténtalo de nuevo.' && (
            <p className="mt-2 text-center text-lg text-gray-300">
              Respuesta correcta: <span className="font-semibold">{currentPhrase?.en}</span>
            </p>
          )}
          {showTranslation && currentPhrase?.es && (
            <p className="mt-2 text-center text-lg text-gray-400">
              Traducción: <span className="font-semibold">{currentPhrase.es}</span>
            </p>
          )}

        </div>
      ) : (
        <p>Cargando frases...</p>
      )}

      <div className="mt-6 flex justify-center">
        <button 
          onClick={() => { cancelSpeech(); selectNewPhrase(); }}
          className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-6 rounded-full transition duration-300"
        >
          Siguiente Frase
        </button>
      </div>

      {/* Voice Settings Component */}
      <div className="mt-8">
        <VoiceSettings 
          settings={phraseSettings}
          onSettingChange={setPhraseSetting}
        />
      </div>
    </div>
  );
};

export default Dictation;
