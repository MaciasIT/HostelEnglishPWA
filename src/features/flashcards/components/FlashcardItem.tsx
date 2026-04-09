import React, { useState, useEffect } from 'react';
import { SpeakerWaveIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { playAudio } from '@/utils/audio';
import { Phrase } from '@/store/useAppStore';

interface FlashcardItemProps {
  phrase: Phrase;
  targetLanguage: string;
  phraseSettings: {
    voiceURI: string;
    rate: number;
    pitch: number;
  };
}

const FlashcardItem: React.FC<FlashcardItemProps> = ({ phrase, targetLanguage, phraseSettings }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  // Reset flip state when phrase changes
  useEffect(() => {
    setIsFlipped(false);
  }, [phrase.id]);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handlePlayAudio = async (lang: 'es' | 'target', e: React.MouseEvent) => {
    e.stopPropagation();

    const targetText = targetLanguage === 'eu' ? phrase.eu : phrase.en;
    const textToSpeak = (lang === 'es' ? phrase.es : targetText) || '';
    const langCode = lang === 'es' ? 'es' : (targetLanguage === 'eu' ? 'eu' : 'en');

    if (!textToSpeak.trim()) return;

    await playAudio(textToSpeak, langCode as 'en' | 'eu' | 'es', {
      rate: phraseSettings.rate,
      pitch: phraseSettings.pitch,
      voiceURI: lang === 'target' ? phraseSettings.voiceURI : undefined
    });
  };

  const targetLangName = targetLanguage === 'eu' ? 'Euskera' : 'Inglés';

  return (
    <div
      className="group perspective-1000 w-full h-[400px] cursor-pointer outline-none focus-within:ring-4 focus-within:ring-accent/50 rounded-[3rem] transition-all"
      onClick={handleFlip}
      onKeyDown={(e) => e.key === 'Enter' && handleFlip()}
      role="button"
      tabIndex={0}
      aria-label={`Tarjeta de estudio. Actualmente mostrando ${isFlipped ? 'Traducción en Español' : 'Original en ' + targetLangName}. Presiona Enter para girar.`}
    >
      <div
        className={`relative w-full h-full transition-all duration-700 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}
      >
        {/* Front Side (Target Language) */}
        <div 
          className="absolute inset-0 w-full h-full backface-hidden bg-white/10 backdrop-blur-2xl rounded-[3rem] border border-white/20 shadow-2xl flex flex-col items-center justify-center p-8 text-center"
          aria-hidden={isFlipped}
        >
          <div className="absolute top-8 right-8 text-white/20" aria-hidden="true">
            <ArrowPathIcon className="w-8 h-8 rotate-12" />
          </div>
          <p className="text-xs uppercase tracking-[0.3em] font-black text-accent mb-6">Original ({targetLangName})</p>
          <div className="flex-grow flex items-center justify-center w-full px-4">
            <h2 className={`font-black text-white leading-tight ${phrase.eu?.length && phrase.eu.length > 50 ? 'text-2xl' : 'text-3xl'}`}>
              "{targetLanguage === 'eu' ? (phrase.eu || '...') : phrase.en}"
            </h2>
          </div>
          <button
            onClick={(e) => handlePlayAudio('target', e)}
            className="p-5 bg-accent text-white rounded-2xl shadow-xl hover:scale-110 active:scale-95 transition-all mb-8 z-10"
            aria-label={`Reproducir audio en ${targetLangName}`}
          >
            <SpeakerWaveIcon className="w-8 h-8" aria-hidden="true" />
          </button>
          <p className="absolute bottom-10 text-[10px] text-gray-500 uppercase tracking-widest font-bold">Toca para traducir</p>
        </div>

        {/* Back Side (Spanish) */}
        <div 
          className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 bg-white/5 backdrop-blur-2xl rounded-[3rem] border border-white/10 shadow-2xl flex flex-col items-center justify-center p-8 text-center"
          aria-hidden={!isFlipped}
        >
          <p className="text-xs uppercase tracking-[0.3em] font-black text-blue-400 mb-6">Traducción (Español)</p>
          <div className="flex-grow flex items-center justify-center w-full px-4">
            <h2 className={`font-black text-white leading-tight ${phrase.es.length > 50 ? 'text-2xl' : 'text-3xl'}`}>
              "{phrase.es}"
            </h2>
          </div>
          <button
            onClick={(e) => handlePlayAudio('es', e)}
            className="p-5 bg-white/10 text-white rounded-2xl shadow-xl hover:bg-white/20 active:scale-110 transition-all border border-white/10 mb-8 z-10"
            aria-label="Reproducir audio en Español"
          >
            <SpeakerWaveIcon className="w-8 h-8 opacity-70" aria-hidden="true" />
          </button>
          <p className="absolute bottom-10 text-[10px] text-gray-500 uppercase tracking-widest font-bold">Toca para volver</p>
        </div>
      </div>
    </div>
  );
};

export default FlashcardItem;
