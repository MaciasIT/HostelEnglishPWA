import { MicrophoneIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface DictationInputProps {
  value: string;
  isListening: boolean;
  transcript: string;
  browserSupportsSpeechRecognition: boolean;
  onChange: (val: string) => void;
  onCheck: () => void;
  onToggleListening: () => void;
}

export default function DictationInput({
  value,
  isListening,
  transcript,
  browserSupportsSpeechRecognition,
  onChange,
  onCheck,
  onToggleListening
}: DictationInputProps) {
  return (
    <div className="space-y-6">
      <div className="relative">
        <p className="text-[10px] uppercase font-black text-gray-500 tracking-[0.3em] mb-4 text-center">
          Paso 2: Escribe o Dicta
        </p>
        <div className="relative group">
          <input
            type="text"
            value={isListening ? transcript : value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={isListening ? "Escuchando voz..." : "Escribe lo que has oído..."}
            className={`w-full p-6 bg-white/5 border-2 rounded-2xl text-white text-xl focus:outline-none transition-all placeholder-gray-600 font-medium ${
              isListening 
                ? 'border-red-500/50 ring-4 ring-red-500/10' 
                : 'border-white/10 focus:border-accent'
            }`}
            disabled={isListening}
            aria-label="Tu respuesta al dictado"
            aria-live="polite"
          />
          {isListening && (
            <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2" aria-hidden="true">
              <span className="text-[10px] font-black text-red-500 animate-pulse">LIVE</span>
              <div className="w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={onCheck}
          className="flex-[2] bg-accent hover:brightness-110 text-white font-black py-5 px-6 rounded-2xl text-lg transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3"
          aria-label="Comprobar respuesta"
        >
          <CheckCircleIcon className="w-6 h-6" aria-hidden="true" />
          COMPROBAR
        </button>
        <button
          onClick={onToggleListening}
          className={`flex-1 p-5 rounded-2xl transition-all shadow-xl active:scale-95 flex items-center justify-center border-2 ${
            isListening 
              ? 'bg-red-500/20 border-red-500 text-red-500' 
              : 'bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20'
          }`}
          disabled={!browserSupportsSpeechRecognition}
          aria-label={isListening ? "Detener dictado por voz" : "Iniciar dictado por voz"}
          aria-pressed={isListening}
        >
          <MicrophoneIcon className={`w-8 h-8 ${isListening ? 'animate-pulse' : ''}`} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
