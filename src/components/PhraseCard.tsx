import { useAppStore, useShallow } from '@/store/useAppStore';
import {
  SpeakerWaveIcon,
  CheckIcon,
  ArrowPathIcon,
  BookmarkIcon
} from '@heroicons/react/24/outline';
import { playAudio } from '@/utils/audio';

type Phrase = {
  id: number | string;
  es: string;
  en: string;
  eu?: string;
  audioEs?: string;
  audioEn?: string;
};

interface PhraseCardProps {
  phrase: Phrase;
  onAdvanceProgress: (phraseId: string) => void;
  progressLevel: number; // 0: unseen, 1: studied, 2: learned
}

const PhraseCard = ({
  phrase,
  onAdvanceProgress,
  progressLevel,
}: PhraseCardProps) => {
  const { phraseSettings, targetLanguage } = useAppStore(
    useShallow((state) => ({
      phraseSettings: state.prefs.phraseSettings,
      targetLanguage: state.prefs.targetLanguage,
    })),
  );

  const handlePlayAudio = async (lang: 'es' | 'target') => {
    const targetText = targetLanguage === 'eu' ? phrase.eu : phrase.en;
    const textToSpeak = lang === 'es' ? phrase.es : targetText;
    const langCode = lang === 'es' ? 'es' : (targetLanguage === 'eu' ? 'eu' : 'en');

    if (!textToSpeak?.trim()) {
      console.warn(`Missing translation for ${lang} in ${targetLanguage}`);
      return;
    }

    await playAudio(textToSpeak, langCode as 'en' | 'eu' | 'es', {
      rate: phraseSettings.rate,
      pitch: phraseSettings.pitch,
      voiceURI: lang === 'target' ? phraseSettings.voiceURI : undefined
    });
  };

  const statusConfig = {
    0: {
      label: 'Pendiente',
      btnText: 'Marcar como Estudiada',
      btnColor: 'bg-surface/5 border-border/10 hover:bg-surface/10',
      icon: BookmarkIcon
    },
    1: {
      label: 'Estudiada',
      btnText: 'Marcar como Aprendida',
      btnColor: 'bg-success/20 text-green-400 border-green-500/30 hover:bg-success/30',
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

  const targetLabel = targetLanguage === 'eu' ? 'EUSKERA' : 'INGLÉS';

  return (
    <div className="group bg-surface/10 backdrop-blur-xl rounded-[2.5rem] border border-border/10 shadow-2xl p-8 sm:p-10 w-full transition-all hover:border-border/20 relative overflow-hidden">
      {/* Abstract Background Element */}
      <div className="absolute -right-20 -top-20 w-40 h-40 bg-accent opacity-5 blur-3xl rounded-full"></div>

      <div className="flex flex-col items-center">
        <span className={`px-4 py-1 rounded-full text-[10px] font-semibold uppercase tracking-widest mb-6 border ${statusConfig.btnColor}`}>
          {statusConfig.label}
        </span>

        <h3 className="text-2xl sm:text-3xl font-black text-primary mb-4 italic leading-tight text-center">
          "{phrase.es}"
        </h3>

        <p className={`text-lg sm:text-xl font-medium mb-10 text-center ${!phrase[targetLanguage === 'eu' ? 'eu' : 'en'] ? 'text-orange-400 italic' : 'text-tertiary'}`}>
          {targetLanguage === 'eu' ? (phrase.eu || 'Traducción pendiente...') : phrase.en}
        </p>

        <div className="flex flex-wrap justify-center gap-4 w-full">
          <div className="flex gap-2">
            <button
              onClick={() => handlePlayAudio('es')}
              aria-label="Escuchar frase en español"
              className="min-w-14 min-h-14 p-4 bg-surface/5 border border-border/10 rounded-2xl text-primary hover:bg-surface/10 active:scale-90 transition-all shadow-lg inline-flex items-center justify-center"
            >
              <SpeakerWaveIcon className="w-6 h-6 opacity-70" />
            </button>
            <button
              onClick={() => handlePlayAudio('target')}
              aria-label={`Escuchar frase en ${targetLabel.toLowerCase()}`}
              className="min-w-14 min-h-14 p-4 bg-accent text-primary rounded-2xl hover:brightness-110 active:scale-90 transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <SpeakerWaveIcon className="w-6 h-6" />
              <span className="font-bold text-sm hidden sm:inline">{targetLabel}</span>
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
