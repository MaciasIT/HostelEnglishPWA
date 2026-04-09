import { useState, useEffect, useCallback, useRef } from 'react';
import { normalizeText, levenshteinDistance } from '@/utils/normalize';
import useSpeechRecognition from '@/hooks/useSpeechRecognition';
import useAudioControl from '@/hooks/useAudioControl';
import { useAppStore, Phrase } from '@/store/useAppStore';
import { playAudio } from '@/utils/audio';

export function useDictationLogic() {
  const { frases, progress, advancePhraseProgress, setPhraseSetting } = useAppStore(state => ({
    frases: state.frases,
    progress: state.progress,
    advancePhraseProgress: state.advancePhraseProgress,
    setPhraseSetting: state.setPhraseSetting,
  }));
  
  const phraseSettings = useAppStore((state) => state.prefs.phraseSettings);
  const targetLanguage = useAppStore((state) => state.prefs.targetLanguage);

  const [currentPhrase, setCurrentPhrase] = useState<Phrase | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState<{ isCorrect: boolean, message: string } | null>(null);
  const [correctAnswer, setCorrectAnswer] = useState<string | null>(null);
  const [showTranslation, setShowTranslation] = useState(false);

  const { 
    isListening, 
    transcript, 
    startListening, 
    stopListening, 
    browserSupportsSpeechRecognition 
  } = useSpeechRecognition();
  
  const { cancelSpeech } = useAudioControl();

  const lastProcessedTranscript = useRef('');

  const selectNewPhrase = useCallback(() => {
    if (frases.length > 0) {
      const randomIndex = Math.floor(Math.random() * frases.length);
      setCurrentPhrase(frases[randomIndex]);
      setUserAnswer('');
      setFeedback(null);
      setCorrectAnswer(null);
      setShowTranslation(false);
      lastProcessedTranscript.current = '';
    }
  }, [frases]);

  const handlePlayAudio = async () => {
    if (currentPhrase) {
      cancelSpeech();
      const textToSpeak = targetLanguage === 'eu' ? currentPhrase.eu : currentPhrase.en;
      const langCode = targetLanguage === 'eu' ? 'eu' : 'en';

      if (!textToSpeak?.trim()) return;

      await playAudio(textToSpeak, langCode as 'en' | 'eu' | 'es', {
        rate: phraseSettings.rate,
        pitch: phraseSettings.pitch,
        voiceURI: phraseSettings.voiceURI
      });
    }
  };

  const performCheck = useCallback((textToCheck: string) => {
    if (!currentPhrase) return;
    cancelSpeech();

    const correctText = targetLanguage === 'eu' ? currentPhrase.eu : currentPhrase.en;
    if (!correctText) return;

    const normalizedUserAnswer = normalizeText(textToCheck);
    const normalizedCorrectAnswer = normalizeText(correctText);
    const distance = levenshteinDistance(normalizedUserAnswer, normalizedCorrectAnswer);
    const toleranceThreshold = Math.floor(normalizedCorrectAnswer.length * 0.15);

    if (distance <= toleranceThreshold) {
      setFeedback({ isCorrect: true, message: '¡Absolutamente correcto!' });
      setCorrectAnswer(null);
      setShowTranslation(true);

      if ((progress[currentPhrase.id] || 0) < 2) {
        advancePhraseProgress(String(currentPhrase.id));
      }
    } else {
      setFeedback({ isCorrect: false, message: '¡Casi! Inténtalo una vez más.' });
      setCorrectAnswer(correctText);
      setShowTranslation(true);
    }
  }, [currentPhrase, cancelSpeech, targetLanguage, progress, advancePhraseProgress]);

  const handleCheckAnswer = useCallback(() => {
    performCheck(userAnswer);
  }, [userAnswer, performCheck]);

  // Sync speech recognition transcript
  useEffect(() => {
    if (!isListening && transcript && transcript !== lastProcessedTranscript.current) {
      lastProcessedTranscript.current = transcript;
      setUserAnswer(transcript);
      performCheck(transcript);
    }
    
    // Reset the guard when we start listening again
    if (isListening) {
      lastProcessedTranscript.current = '';
    }
  }, [isListening, transcript, performCheck]);

  return {
    state: {
      currentPhrase,
      userAnswer,
      feedback,
      correctAnswer,
      showTranslation,
      isListening,
      transcript,
      browserSupportsSpeechRecognition,
      phraseSettings,
      targetLanguage
    },
    actions: {
      setUserAnswer,
      selectNewPhrase,
      handlePlayAudio,
      handleCheckAnswer,
      startListening,
      stopListening,
      setPhraseSetting,
      cancelSpeech
    }
  };
}
