import React from 'react';
import { useAppStore } from '@/store/useAppStore';
import {
  SpeakerWaveIcon,
  CheckIcon,
  ArrowPathIcon,
  BookmarkIcon
} from '@heroicons/react/24/outline';

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
    window.speechSynthesis.cancel();
    const textToSpeak = lang === 'es' ? phrase.es : phrase.en;
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

  const statusConfig = {
    0: {
      label: 'Pendiente',
      btnText: 'Marcar como Estudiada',
      btnColor: 'bg-white/5 border-white/10 hover:bg-white/10',
      icon: BookmarkIcon
    },
    1: {
      label: 'Estudiada',
      btnText: 'Marcar como Aprendida',
      btnColor: 'bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30',
      icon: CheckIcon
    },
    2: {
      label: 'Aprendida',
      btnText: 'Reiniciar Progreso',
      btnColor: 'bg-accent/20 text-accent border-accent/30 hover:bg-accent/30',
      icon: ArrowPathIcon
    }
  }[progressLevel] || {
    label: 'Desconocido',
    btnText: 'Actualizar',
    btnColor: 'bg-gray-500',
    icon: BookmarkIcon
  };

  return (
    <div className="group bg-white/10 backdrop-blur-xl rounded-[2.5rem] border border-white/10 shadow-2xl p-8 sm:p-10 w-full transition-all hover:border-white/20 relative overflow-hidden">
      {/* Abstract Background Element */}
      <div className="absolute -right-20 -top-20 w-40 h-40 bg-accent opacity-5 blur-3xl rounded-full"></div>

      <div className="flex flex-col items-center">
        <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 border ${statusConfig.btnColor}`}>
          {statusConfig.label}
        </span>

        <h3 className="text-2xl sm:text-3xl font-black text-white mb-4 italic leading-tight text-center">
          "{phrase.es}"
        </h3>

        <p className="text-lg sm:text-xl text-gray-400 font-medium mb-10 text-center">
          {phrase.en}
        </p>

        <div className="flex flex-wrap justify-center gap-4 w-full">
          <div className="flex gap-2">
            <button
              onClick={() => handlePlayAudio('es')}
              className="p-4 bg-white/5 border border-white/10 rounded-2xl text-white hover:bg-white/10 active:scale-90 transition-all shadow-lg"
              title="Escuchar en Español"
            >
              <SpeakerWaveIcon className="w-6 h-6 opacity-70" />
            </button>
            <button
              onClick={() => handlePlayAudio('en')}
              className="p-4 bg-accent text-white rounded-2xl hover:brightness-110 active:scale-90 transition-all shadow-lg flex items-center gap-2"
              title="Escuchar en Inglés"
            >
              <SpeakerWaveIcon className="w-6 h-6" />
              <span className="font-bold text-sm hidden sm:inline">INGLÉS</span>
            </button>
          </div>

          <button
            onClick={() => onAdvanceProgress(String(phrase.id))}
            className={`flex-grow sm:flex-grow-0 px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-widest border transition-all active:scale-95 flex items-center justify-center gap-2 ${statusConfig.btnColor}`}
          >
            <statusConfig.icon className="w-5 h-5" />
            {statusConfig.btnText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PhraseCard;
