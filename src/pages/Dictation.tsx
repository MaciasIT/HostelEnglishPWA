import React, { useState, useEffect, useCallback } from 'react';
import { normalizeText, levenshteinDistance } from '@/utils/normalize';
import useSpeechRecognition from '@/hooks/useSpeechRecognition';
import VoiceSettings from '@/components/VoiceSettings';
import useAudioControl from '@/hooks/useAudioControl';
import { useAppStore, Phrase } from '../store/useAppStore';
import PageContainer from '@/components/layout/PageContainer';
import CollapsibleSection from '@/components/CollapsibleSection';
import ModuleIntro from '@/components/ModuleIntro';
import { MicrophoneIcon } from '@heroicons/react/24/outline';

const Dictation: React.FC = () => {
  const [showWelcome, setShowWelcome] = useState(true);
  const frases = useAppStore((state) => state.frases);
  const [currentPhrase, setCurrentPhrase] = useState<Phrase | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState<string | null>(null);
  const [showTranslation, setShowTranslation] = useState(false);

  const { isListening, transcript, startListening, stopListening, browserSupportsSpeechRecognition, error: speechError, requestingPermission } = useSpeechRecognition();
  const { cancelSpeech } = useAudioControl();

  const phraseSettings = useAppStore((state) => state.prefs.phraseSettings);
  const setPhraseSetting = useAppStore((state) => state.setPhraseSetting);

  const selectNewPhrase = useCallback(() => {
    if (frases.length > 0) {
      const randomIndex = Math.floor(Math.random() * frases.length);
      setCurrentPhrase(frases[randomIndex]);
      setUserAnswer('');
      setFeedback('');
      setCorrectAnswer(null);
      setShowTranslation(false);
    }
  }, [frases]);

  useEffect(() => {
    if (!showWelcome) {
      selectNewPhrase();
    }
  }, [showWelcome, selectNewPhrase]);

  const handlePlayAudio = () => {
    if (currentPhrase) {
      cancelSpeech();

      const utterance = new SpeechSynthesisUtterance(currentPhrase.en);
      utterance.lang = 'en-US';
      utterance.rate = phraseSettings.rate;
      utterance.pitch = phraseSettings.pitch;

      if (phraseSettings.voiceURI) {
        const voice = window.speechSynthesis.getVoices().find(v => v.voiceURI === phraseSettings.voiceURI);
        if (voice) {
          utterance.voice = voice;
        }
      } else {
        const voices = window.speechSynthesis.getVoices();
        const englishVoice = voices.find(voice => voice.lang.startsWith('en'));
        if (englishVoice) {
          utterance.voice = englishVoice;
        }
      }

      window.speechSynthesis.speak(utterance);
    }
  };

  const handleCheckAnswer = useCallback(() => {
    if (!currentPhrase) return;

    cancelSpeech();

    const normalizedUserAnswer = normalizeText(userAnswer);
    const normalizedCorrectAnswer = normalizeText(currentPhrase.en);

    const distance = levenshteinDistance(normalizedUserAnswer, normalizedCorrectAnswer);
    const toleranceThreshold = Math.floor(normalizedCorrectAnswer.length * 0.15);

    if (distance <= toleranceThreshold) {
      setFeedback('¡Correcto!');
      setCorrectAnswer(null);
      setShowTranslation(true);
    } else {
      setFeedback('Inténtalo de nuevo.');
      setCorrectAnswer(currentPhrase.en);
      setShowTranslation(true);
    }
  }, [currentPhrase, userAnswer, cancelSpeech]);

  const handleStopListening = () => {
    stopListening();
    setTimeout(() => {
      if (currentPhrase) {
        const normalizedUserAnswer = normalizeText(transcript);
        const normalizedCorrectAnswer = normalizeText(currentPhrase.en);
        const isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;
        setFeedback(isCorrect ? '¡Correcto!' : 'Inténtalo de nuevo.');
        if (!isCorrect) {
          setCorrectAnswer(currentPhrase.en);
        }
      }
    }, 1000);
  };

  useEffect(() => {
    if (!isListening && transcript) {
      setUserAnswer(transcript);
      handleCheckAnswer();
    }
  }, [isListening, transcript, handleCheckAnswer]);

  if (showWelcome) {
    return (
      <PageContainer>
        <ModuleIntro
          title="Módulo de Dictado"
          description="Pon a prueba tu oído y escritura. Escucha frases en inglés y escríbelas correctamente para mejorar tu ortografía y comprensión auditiva."
          icon={MicrophoneIcon}
          onStart={() => setShowWelcome(false)}
          stats={[
            { label: 'Frases', value: frases.length },
            { label: 'Habilidad', value: 'Listening' },
            { label: 'Nivel', value: 'Intermedio' }
          ]}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Módulo de Dictado">
      {currentPhrase ? (
        <div className="bg-white/10 p-8 rounded-3xl shadow-2xl backdrop-blur-md border border-white/20 max-w-2xl mx-auto">
          <div className="flex flex-col items-center justify-center gap-6 mb-8">
            <p className="text-xl text-center text-gray-300 uppercase tracking-widest font-black">Escucha con atención</p>
            <button
              aria-label="reproducir audio"
              onClick={handlePlayAudio}
              className="w-24 h-24 bg-accent rounded-full flex items-center justify-center text-5xl shadow-xl hover:scale-110 active:scale-95 transition-all duration-300 transform"
            >
              🔊
            </button>
          </div>

          <div className="space-y-6">
            <div className="relative">
              <input
                type="text"
                value={isListening ? transcript : userAnswer}
                onChange={(e) => { cancelSpeech(); setUserAnswer(e.target.value); }}
                placeholder={isListening ? "Escuchando..." : "Escribe lo que escuchas..."}
                className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-white text-xl focus:outline-none focus:ring-2 focus:ring-accent transition-all placeholder-gray-500"
                disabled={isListening}
              />
              {isListening && <div className="absolute right-4 top-1/2 -translate-y-1/2 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => { cancelSpeech(); handleCheckAnswer(); }}
                className="flex-[2] bg-accent hover:brightness-110 text-white font-bold py-4 px-6 rounded-2xl text-xl transition-all shadow-lg active:scale-95"
              >
                Comprobar
              </button>
              <button
                onClick={() => {
                  cancelSpeech();
                  isListening ? handleStopListening() : startListening();
                }}
                className={`flex-1 p-4 rounded-2xl text-2xl transition-all shadow-lg active:scale-95 flex items-center justify-center ${isListening ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-700'}`}
                aria-label={isListening ? "detener dictado por voz" : "iniciar dictado por voz"}
                disabled={!browserSupportsSpeechRecognition}
              >
                {isListening ? '🛑' : '🎤'}
              </button>
            </div>
          </div>

          {!browserSupportsSpeechRecognition && (
            <p className="mt-4 text-center text-red-400 text-sm">
              Tu navegador no soporta el reconocimiento de voz.
            </p>
          )}

          {feedback && (
            <div className={`mt-8 p-6 rounded-2xl text-center animate-in slide-in-from-top-4 duration-300 ${feedback === '¡Correcto!' ? 'bg-green-500/20 border border-green-500/50' : 'bg-red-500/20 border border-red-500/50'}`}>
              <p className={`text-2xl font-black ${feedback === '¡Correcto!' ? 'text-green-400' : 'text-red-400'}`}>
                {feedback}
              </p>
              {correctAnswer && feedback === 'Inténtalo de nuevo.' && (
                <div className="mt-4 pt-4 border-t border-red-500/20">
                  <p className="text-gray-400 text-sm uppercase tracking-tighter mb-1">Debiste escribir:</p>
                  <p className="text-lg text-white font-bold italic">"{currentPhrase?.en}"</p>
                </div>
              )}
              {showTranslation && currentPhrase?.es && (
                <div className="mt-2">
                  <p className="text-gray-400 text-sm uppercase tracking-tighter mb-1">Traducción:</p>
                  <p className="text-lg text-white font-medium italic">{currentPhrase.es}</p>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-20">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-400">Preparando frases...</p>
        </div>
      )}

      <div className="mt-8 flex justify-center">
        <button
          onClick={() => { cancelSpeech(); selectNewPhrase(); }}
          className="bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-10 rounded-2xl transition-all active:scale-95 border border-white/10"
        >
          Siguiente Desafío
        </button>
      </div>

      <div className="mt-12 max-w-2xl mx-auto">
        <CollapsibleSection title="Ajustes de Voz">
          <VoiceSettings
            settings={phraseSettings}
            onSettingChange={setPhraseSetting}
            showTitle={false}
          />
        </CollapsibleSection>
      </div>
    </PageContainer>
  );
};

export default Dictation;
