import { SpeakerWaveIcon } from '@heroicons/react/24/outline';

interface DictationPlayerProps {
  onPlay: () => void;
}

export default function DictationPlayer({ onPlay }: DictationPlayerProps) {
  return (
    <div className="flex flex-col items-center mb-10">
      <p className="text-[10px] uppercase font-black text-accent tracking-[0.3em] mb-6">
        Paso 1: Escucha la frase
      </p>
      <button
        onClick={onPlay}
        className="group relative w-28 h-28 bg-accent rounded-[2rem] flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300"
        aria-label="Reproducir frase para dictado"
      >
        <SpeakerWaveIcon className="w-12 h-12 text-white group-hover:animate-pulse" aria-hidden="true" />
        <div className="absolute -inset-2 bg-accent opacity-20 blur-xl rounded-full group-hover:opacity-40 transition-opacity"></div>
      </button>
    </div>
  );
}
