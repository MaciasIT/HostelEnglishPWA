import React from 'react';
import { useAppStore } from '@/store/useAppStore';

type Phrase = {
  id: number | string;
  es: string;
  en: string;
  audioEs?: string;
  audioEn?: string;
};

interface PhraseCardProps {
  phrase: Phrase;
  onAdvanceProgress: (phraseId: string) => void;
  progressLevel: number; // 0: unseen, 1: studied, 2: learned
}

const PhraseCard: React.FC<PhraseCardProps> = ({
  phrase,
  onAdvanceProgress,
  progressLevel,
}) => {
  const { phraseSettings } = useAppStore((state) => ({
    phraseSettings: state.prefs.phraseSettings,
  }));

  const handlePlayAudio = (lang: 'es' | 'en') => {
    const textToSpeak = lang === 'es' ? phrase.es : phrase.en;
    const speechLang = lang === 'es' ? 'es-ES' : 'en-US';

    if (!textToSpeak.trim()) {
      console.warn("Attempted to speak empty text.");
      return;
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = speechLang;

    if (lang === 'en') {
      utterance.rate = phraseSettings.rate;
      utterance.pitch = phraseSettings.pitch;
      if (phraseSettings.voiceURI) {
        const voice = window.speechSynthesis.getVoices().find(v => v.voiceURI === phraseSettings.voiceURI);
        if (voice) {
          utterance.voice = voice;
        }
      }
    }

    window.speechSynthesis.speak(utterance);
  };

  const getButtonAppearance = () => {
    switch (progressLevel) {
      case 1: // Studied
        return { text: 'Marcar como Aprendida', className: 'bg-green-500 hover:bg-green-600 text-white' };
      case 2: // Learned
        return { text: 'Reiniciar Progreso', className: 'bg-yellow-500 hover:bg-yellow-600 text-white' };
      default: // Unseen (0 or undefined)
        return { text: 'Marcar como Estudiada', className: 'bg-primary-dark hover:bg-primary text-white' };
    }
  };

  const { text, className } = getButtonAppearance();

  return (
    <div className="bg-white/10 rounded-lg shadow-md p-4 mb-4">
      <p className="text-white text-lg font-semibold mb-2">{phrase.es}</p>
      <p className="text-gray-300 text-md mb-4">{phrase.en}</p>
      <div className="flex justify-between items-center">
        <div>
          <button
            onClick={() => handlePlayAudio('es')}
            className="bg-primary hover:bg-primary-dark text-white px-3 py-1 rounded-md mr-2"
          >
            Audio ES
          </button>
          <button
            onClick={() => handlePlayAudio('en')}
            className="bg-primary hover:bg-primary-dark text-white px-3 py-1 rounded-md"
          >
            Audio EN
          </button>
        </div>
        <button
          onClick={() => onAdvanceProgress(String(phrase.id))}
          className={`px-3 py-1 rounded-md ${className}`}
        >
          {text}
        </button>
      </div>
    </div>
  );
};

export default PhraseCard;
