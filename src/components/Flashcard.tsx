import React, { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { SpeakerWaveIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

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
  const { phraseSettings } = useAppStore((state) => ({
    phraseSettings: state.prefs.phraseSettings,
  }));

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handlePlayAudio = (lang: 'es' | 'en', e: React.MouseEvent) => {
    e.stopPropagation();
    window.speechSynthesis.cancel();
    const textToSpeak = (lang === 'es' ? phrase.es : phrase.en) || '';
    const speechLang = lang === 'es' ? 'es-ES' : 'en-US';

    if (!textToSpeak.trim()) return;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = speechLang;

    if (lang === 'en') {
      utterance.rate = phraseSettings.rate;
      utterance.pitch = phraseSettings.pitch;
      if (phraseSettings.voiceURI) {
        const voice = window.speechSynthesis.getVoices().find(v => v.voiceURI === phraseSettings.voiceURI);
        if (voice) utterance.voice = voice;
      }
    }

    window.speechSynthesis.speak(utterance);
  };

  return (
    <div
      className="group perspective-1000 w-full h-[400px] cursor-pointer"
      onClick={handleFlip}
    >
      <div className={`relative w-full h-full transition-all duration-700 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>

        {/* Front Side (English) */}
        <div className="absolute inset-0 w-full h-full backface-hidden bg-white/10 backdrop-blur-2xl rounded-[3rem] border border-white/20 shadow-2xl flex flex-col items-center justify-center p-8 text-center overscroll-none">
          <div className="absolute top-8 right-8 text-white/20">
            <ArrowPathIcon className="w-8 h-8 rotate-12" />
          </div>
          <p className="text-xs uppercase tracking-[0.3em] font-black text-accent mb-6">Original</p>
          <h2 className="text-4xl sm:text-5xl font-black text-white italic leading-tight mb-12">
            "{phrase.en}"
          </h2>
          <button
            onClick={(e) => handlePlayAudio('en', e)}
            className="p-5 bg-accent text-white rounded-2xl shadow-xl hover:scale-110 active:scale-95 transition-all"
          >
            <SpeakerWaveIcon className="w-8 h-8" />
          </button>
          <p className="absolute bottom-10 text-[10px] text-gray-500 uppercase tracking-widest font-bold">Toca para traducir</p>
        </div>

        {/* Back Side (Spanish) */}
        <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 bg-white/5 backdrop-blur-2xl rounded-[3rem] border border-white/10 shadow-2xl flex flex-col items-center justify-center p-8 text-center">
          <p className="text-xs uppercase tracking-[0.3em] font-black text-blue-400 mb-6">Traducción</p>
          <h2 className="text-4xl sm:text-5xl font-black text-white leading-tight mb-12">
            "{phrase.es}"
          </h2>
          <button
            onClick={(e) => handlePlayAudio('es', e)}
            className="p-5 bg-white/10 text-white rounded-2xl shadow-xl hover:bg-white/20 active:scale-110 transition-all border border-white/10"
          >
            <SpeakerWaveIcon className="w-8 h-8 opacity-70" />
          </button>
          <p className="absolute bottom-10 text-[10px] text-gray-500 uppercase tracking-widest font-bold">Toca para volver</p>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}} />
    </div>
  );
};

export default Flashcard;
