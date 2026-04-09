import { ShieldCheckIcon } from '@heroicons/react/24/outline';

interface ExamSetupProps {
  onStart: (limit: number) => void;
  onBack: () => void;
  targetLanguage: 'en' | 'eu' | 'es';
}

export default function ExamSetup({ onStart, onBack, targetLanguage }: ExamSetupProps) {
  const langLabel = targetLanguage === 'eu' ? 'euskera' : 'inglés';

  return (
    <div className="max-w-2xl mx-auto py-12 text-center">
      <div className="bg-white/5 p-10 rounded-[3rem] border border-white/10 shadow-2xl backdrop-blur-xl mb-12">
        <ShieldCheckIcon className="w-16 h-16 text-accent mx-auto mb-6" />
        <h2 className="text-3xl font-black text-white mb-4">Examen Global</h2>
        <p className="text-gray-400 mb-8 max-w-md mx-auto">
          Se te presentarán 10 frases aleatorias en <span className="text-accent font-bold">{langLabel}</span>. 
          Debes acertar al menos el <span className="text-white font-bold">80%</span> para considerarlo superado.
        </p>
        
        <div className="space-y-4">
          <button
            onClick={() => onStart(10)}
            className="w-full bg-accent hover:brightness-110 text-white font-black py-4 rounded-2xl text-xl shadow-lg transition-all active:scale-95"
          >
            Comenzar Examen
          </button>
          <button
            onClick={onBack}
            className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-2xl transition-all text-sm uppercase tracking-widest"
          >
            Volver
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 px-6 text-[10px] font-black uppercase tracking-widest text-gray-500">
        <div>10 Preguntas</div>
        <div>Sin Vidas</div>
        <div>Récord Global</div>
      </div>
    </div>
  );
}
