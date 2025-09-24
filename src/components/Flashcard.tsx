import React, { useState } from 'react';
// import useAudio from '@/hooks/useAudio'; // REMOVE THIS
import { useAppStore } from '@/store/useAppStore';

type Phrase = {
  id: number | string;
  es: string;
  en: string;
  audioEs?: string;
  audioEn?: string;
};

interface FlashcardProps {
  phrase: Phrase;
}

const Flashcard: React.FC<FlashcardProps> = ({ phrase }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  // const { playAudio } = useAudio(); // REMOVE THIS
  const audioSpeed = useAppStore((state) => state.prefs.audioSpeed);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handlePlayAudio = (lang: 'es' | 'en') => {
    const textToSpeak = (lang === 'es' ? phrase.es : phrase.en) || '';
    const speechLang = lang === 'es' ? 'es-ES' : 'en-US';

    if (!textToSpeak.trim()) {
      console.warn("Attempted to speak empty text.");
      return;
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = speechLang;
    utterance.rate = audioSpeed;

    // No cancellation logic for this diagnostic test
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div
      className="relative w-full h-64 rounded-lg shadow-lg cursor-pointer bg-primary flex items-center justify-center p-4"
      onClick={handleFlip}
    >
      {!isFlipped ? (
        // Front of the card (English)
        <div className="text-center">
          <p className="text-2xl font-bold text-white">
            {phrase.en}
          </p>
          <button
            onClick={(e) => { e.stopPropagation(); handlePlayAudio('en'); }}
            className="mt-4 px-4 py-2 bg-white/20 text-white rounded-md hover:bg-white/30"
          >
            Reproducir EN
          </button>
        </div>
      ) : (
        // Back of the card (Spanish)
        <div className="text-center">
          <p className="text-2xl font-bold text-white">
            {phrase.es}
          </p>
          <button
            onClick={(e) => { e.stopPropagation(); handlePlayAudio('es'); }}
            className="mt-4 px-4 py-2 bg-accent text-white rounded-md hover:bg-accent-dark"
          >
            Reproducir ES
          </button>
        </div>
      )}
    </div>
  );
};

export default Flashcard;
