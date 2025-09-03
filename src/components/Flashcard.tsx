import React, { useState } from 'react';
import { useAudio } from '@/hooks/useAudio';
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
  const { playAudio } = useAudio();
  const audioSpeed = useAppStore((state) => state.prefs.audioSpeed);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handlePlayAudio = (lang: 'es' | 'en') => {
    if (lang === 'es' && phrase.audioEs) {
      playAudio(`/audio/${phrase.audioEs}`, audioSpeed);
    } else if (lang === 'en' && phrase.audioEn) {
      playAudio(`/audio/${phrase.audioEn}`, audioSpeed);
    } else {
      // Fallback to TTS if no specific audio file or if it's not found
      playAudio(lang === 'es' ? phrase.es : phrase.en, audioSpeed, true);
    }
  };

  return (
    <div
      className="relative w-full h-64 rounded-lg shadow-lg cursor-pointer transform transition-transform duration-500 ease-in-out"
      onClick={handleFlip}
      style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
    >
      {/* Front of the card */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white dark:bg-gray-800 rounded-lg backface-hidden p-4" style={{ zIndex: isFlipped ? 0 : 1 }}>
        <p className="text-2xl font-bold text-gray-900 dark:text-white text-center">
          {phrase.en}
        </p>
        <button
          onClick={(e) => { e.stopPropagation(); handlePlayAudio('en'); }}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Reproducir EN
        </button>
      </div>

      {/* Back of the card */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white dark:bg-gray-800 rounded-lg backface-hidden p-4 rotateY-180" style={{ zIndex: isFlipped ? 1 : 0 }}>
        <div style={{ transform: 'rotateY(-180deg)' }}>
          <p className="text-2xl font-bold text-gray-900 dark:text-white text-center">
            {phrase.es}
          </p>
          <button
            onClick={(e) => { e.stopPropagation(); handlePlayAudio('es'); }}
            className="mt-4 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
          >
            Reproducir ES
          </button>
        </div>
      </div>
    </div>
  );
};

export default Flashcard;
