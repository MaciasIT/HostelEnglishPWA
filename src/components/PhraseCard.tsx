import React, { useState } from 'react';
// import { useAudio } from '@/hooks/useAudio'; // REMOVE THIS
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

const PhraseCard: React.FC<FlashcardProps> = ({
  phrase,
  onToggleStudied,
  isStudied,
  // onPlayAudio, // REMOVE THIS
}) => {
  // const { playAudio } = useAudio(); // REMOVE THIS
  const audioSpeed = useAppStore((state) => state.prefs.audioSpeed);

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
          onClick={() => onToggleStudied(phrase.id)}
          className={`px-3 py-1 rounded-md ${isStudied
            ? 'bg-accent hover:bg-accent-dark text-white'
            : 'bg-primary-dark hover:bg-primary text-white'
          }`}
        >
          {isStudied ? 'Estudiada' : 'Marcar como estudiada'}
        </button>
      </div>
    </div>
  );
};

export default PhraseCard;
