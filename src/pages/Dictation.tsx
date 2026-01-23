import React, { useState, useEffect, useCallback } from 'react';
import { normalizeText, levenshteinDistance } from '@/utils/normalize';
import useSpeechRecognition from '@/hooks/useSpeechRecognition';
import VoiceSettings from '@/components/VoiceSettings';
import useAudioControl from '@/hooks/useAudioControl';
import { useAppStore, Phrase } from '../store/useAppStore';
import PageContainer from '@/components/layout/PageContainer';
import CollapsibleSection from '@/components/CollapsibleSection';
import ModuleIntro from '@/components/ModuleIntro';
import {
  MicrophoneIcon,
  SpeakerWaveIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowRightIcon,
  LanguageIcon
} from '@heroicons/react/24/outline';

const Dictation: React.FC = () => {
  const [showWelcome, setShowWelcome] = useState(true);
  const { frases, progress, advancePhraseProgress, setPhraseSetting } = useAppStore(state => ({
    frases: state.frases,
    progress: state.progress,
    advancePhraseProgress: state.advancePhraseProgress,
    setPhraseSetting: state.setPhraseSetting,
  }));
  const phraseSettings = useAppStore((state) => state.prefs.phraseSettings);

  const [currentPhrase, setCurrentPhrase] = useState<Phrase | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState<{ isCorrect: boolean, message: string } | null>(null);
  const [correctAnswer, setCorrectAnswer] = useState<string | null>(null);
  const [showTranslation, setShowTranslation] = useState(false);

  const { isListening, transcript, startListening, stopListening, browserSupportsSpeechRecognition } = useSpeechRecognition();
  const { cancelSpeech } = useAudioControl();

  const selectNewPhrase = useCallback(() => {
    if (frases.length > 0) {
      const randomIndex = Math.floor(Math.random() * frases.length);
      setCurrentPhrase(frases[randomIndex]);
      setUserAnswer('');
      setFeedback(null);
      setCorrectAnswer(null);
      setShowTranslation(false);
    }
  }, [frases]);

  useEffect(() => {
    if (!showWelcome) selectNewPhrase();
  }, [showWelcome, selectNewPhrase]);

  const targetLanguage = useAppStore((state) => state.prefs.targetLanguage);

  const handlePlayAudio = () => {
    if (currentPhrase) {
      cancelSpeech();
      const textToSpeak = targetLanguage === 'eu' ? currentPhrase.eu : currentPhrase.en;
      const voiceLang = targetLanguage === 'eu' ? 'eu-ES' : 'en-US';

      if (!textToSpeak?.trim()) return;

      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = voiceLang;
      utterance.rate = phraseSettings.rate;
      utterance.pitch = phraseSettings.pitch;

      if (phraseSettings.voiceURI) {
        // Only use the saved voice if it matches the current target language
        const voice = window.speechSynthesis.getVoices().find(v => v.voiceURI === phraseSettings.voiceURI);
        if (voice && voice.lang.startsWith(targetLanguage === 'eu' ? 'eu' : 'en')) {
          utterance.voice = voice;
        }
      }
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleCheckAnswer = useCallback(() => {
    if (!currentPhrase) return;
    cancelSpeech();

    const correctText = targetLanguage === 'eu' ? currentPhrase.eu : currentPhrase.en;
    if (!correctText) return;

    const normalizedUserAnswer = normalizeText(userAnswer);
    const normalizedCorrectAnswer = normalizeText(correctText);
    const distance = levenshteinDistance(normalizedUserAnswer, normalizedCorrectAnswer);
    const toleranceThreshold = Math.floor(normalizedCorrectAnswer.length * 0.15);

    if (distance <= toleranceThreshold) {
      setFeedback({ isCorrect: true, message: '¡Absolutamente correcto!' });
      setCorrectAnswer(null);
      setShowTranslation(true);

      // Advance progress if correct
      if ((progress[currentPhrase.id] || 0) < 2) {
        advancePhraseProgress(String(currentPhrase.id));
      }
    } else {
      setFeedback({ isCorrect: false, message: '¡Casi! Inténtalo una vez más.' });
      setCorrectAnswer(correctText);
      setShowTranslation(true);
    }
  }, [currentPhrase, userAnswer, cancelSpeech, targetLanguage, progress, advancePhraseProgress]);

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
          description="Entrena tu oído y tu escritura al mismo tiempo. Escucha la frase y escríbela sin errores para dominar la comunicación escrita."
          icon={MicrophoneIcon}
          onStart={() => setShowWelcome(false)}
          stats={[
            { label: 'Enfoque', value: 'Listening' },
            { label: 'Desafío', value: 'Escritura' },
            { label: 'Racha', value: '0' }
          ]}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Dictado Interactivo">
      <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
        <div className="bg-white/10 backdrop-blur-2xl p-10 rounded-[3rem] shadow-2xl border border-white/20 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-accent opacity-5 blur-3xl rounded-full"></div>

          <div className="flex flex-col items-center mb-10">
            <p className="text-[10px] uppercase font-black text-accent tracking-[0.3em] mb-6">Paso 1: Escucha</p>
            <button
              onClick={handlePlayAudio}
              className="group relative w-28 h-28 bg-accent rounded-[2rem] flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300"
            >
              <SpeakerWaveIcon className="w-12 h-12 text-white group-hover:animate-pulse" />
              <div className="absolute -inset-2 bg-accent opacity-20 blur-xl rounded-full group-hover:opacity-40 transition-opacity"></div>
            </button>
          </div>

          <div className="space-y-6">
            <div className="relative">
              <p className="text-[10px] uppercase font-black text-gray-500 tracking-[0.3em] mb-4 text-center">Paso 2: Escribe o Dicta</p>
              <div className="relative group">
                <input
                  type="text"
                  value={isListening ? transcript : userAnswer}
                  onChange={(e) => { cancelSpeech(); setUserAnswer(e.target.value); }}
                  placeholder={isListening ? "Escuchando voz..." : "Escribe lo que has oído..."}
                  className={`w-full p-6 bg-white/5 border-2 rounded-2xl text-white text-xl focus:outline-none transition-all placeholder-gray-600 font-medium ${isListening ? 'border-red-500/50 ring-4 ring-red-500/10' : 'border-white/10 focus:border-accent'}`}
                  disabled={isListening}
                />
                {isListening && (
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <span className="text-[10px] font-black text-red-500 animate-pulse">LIVE</span>
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleCheckAnswer}
                className="flex-[2] bg-accent hover:brightness-110 text-white font-black py-5 px-6 rounded-2xl text-lg transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3"
              >
                <CheckCircleIcon className="w-6 h-6" />
                COMPROBAR
              </button>
              <button
                onClick={() => { cancelSpeech(); isListening ? stopListening() : startListening(); }}
                className={`flex-1 p-5 rounded-2xl transition-all shadow-xl active:scale-95 flex items-center justify-center border-2 ${isListening ? 'bg-red-500/20 border-red-500 text-red-500' : 'bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20'}`}
                disabled={!browserSupportsSpeechRecognition}
              >
                <MicrophoneIcon className={`w-8 h-8 ${isListening ? 'animate-pulse' : ''}`} />
              </button>
            </div>
          </div>

          {feedback && (
            <div className={`mt-10 p-8 rounded-[2rem] text-center animate-in zoom-in-95 duration-500 border-2 ${feedback.isCorrect ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
              <div className="flex flex-col items-center">
                {feedback.isCorrect ? (
                  <CheckCircleIcon className="w-12 h-12 text-green-500 mb-3" />
                ) : (
                  <XCircleIcon className="w-12 h-12 text-red-500 mb-3" />
                )}
                <p className={`text-2xl font-black ${feedback.isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                  {feedback.message}
                </p>
              </div>

              {correctAnswer && !feedback.isCorrect && (
                <div className="mt-6 pt-6 border-t border-white/5">
                  <p className="text-[10px] text-gray-500 uppercase font-black mb-2">Respuesta Correcta:</p>
                  <p className="text-xl text-white font-black italic">"{correctAnswer}"</p>
                </div>
              )}

              {showTranslation && currentPhrase?.es && (
                <div className="mt-4 flex items-center justify-center gap-2 text-gray-400">
                  <LanguageIcon className="w-4 h-4" />
                  <p className="text-sm italic font-medium">{currentPhrase.es}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button
            onClick={() => { cancelSpeech(); selectNewPhrase(); }}
            className="bg-white/5 hover:bg-white/10 text-white font-black py-4 px-10 rounded-2xl transition-all active:scale-95 border border-white/10 flex items-center justify-center gap-3"
          >
            SIGUIENTE FRASE
            <ArrowRightIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="pt-8">
          <CollapsibleSection title="Personalización de Audio">
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
};

export default Dictation;
