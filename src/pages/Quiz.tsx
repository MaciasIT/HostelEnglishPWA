import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import PageContainer from '@/components/layout/PageContainer';
import CollapsibleSection from '@/components/CollapsibleSection';
import VoiceSettings from '@/components/VoiceSettings';
import ModuleIntro from '@/components/ModuleIntro';
import { AcademicCapIcon } from '@heroicons/react/24/outline';
import QuizContainer from '@/features/quiz/QuizContainer';
import { QuizMode } from '@/features/quiz/types';

export default function Quiz() {
  const { loadFrases, frasesLoaded, categories, prefs, setPhraseSetting } = useAppStore();
  const phraseSettings = prefs.phraseSettings;
  
  const [quizActive, setQuizActive] = useState(false);
  const [selectedMode, setSelectedMode] = useState<QuizMode>('multiple');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);

  useEffect(() => {
    if (!frasesLoaded) {
      loadFrases();
    }
  }, [frasesLoaded, loadFrases]);

  const handleStartQuiz = () => {
    setQuizActive(true);
  };

  const handleExitQuiz = () => {
    setQuizActive(false);
    setShowWelcome(false);
  };

  if (showWelcome) {
    return (
      <ModuleIntro
        title="Quiz Master"
        description="Pon a prueba tus conocimientos con desafíos interactivos. Elige tu modo de juego y categoría profesional para empezar."
        icon={AcademicCapIcon}
        onStart={() => setShowWelcome(false)}
      />
    );
  }
  return (
    <PageContainer>
      <div className="max-w-4xl mx-auto space-y-12 pb-20">
        
        {!quizActive ? (
          <div className="animate-in fade-in slide-in-from-bottom-5 duration-700">
            <header className="mb-12 text-center">
              <h1 className="text-5xl font-black text-white mb-4 tracking-tighter">
                DESAFÍO <span className="text-accent underline decoration-4 underline-offset-8">HOSTEL</span>
              </h1>
              <p className="text-gray-400 text-lg max-w-xl mx-auto">
                Selecciona tu especialidad y el tipo de entrenamiento que prefieres hoy.
              </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Configuration Sidebar */}
              <div className="lg:col-span-1 space-y-6">
                <CollapsibleSection title="Configuración de Voz">
                  <VoiceSettings 
                    settings={phraseSettings}
                    onSettingChange={setPhraseSetting}
                  />
                </CollapsibleSection>

                <div className="bg-white/5 p-6 rounded-3xl border border-white/10 space-y-4">
                   <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Modo de Juego</h3>
                   <div className="flex flex-col gap-2">
                      {[
                        { id: 'multiple', label: 'Opción Múltiple', desc: '4 opciones, 1 respuesta' },
                        { id: 'truefalse', label: 'Verdadero / Falso', desc: '¿Es correcta la traducción?' },
                        { id: 'scramble', label: 'Ordenar Frase', desc: 'Construye la respuesta' }
                      ].map((m) => (
                        <button
                          key={m.id}
                          onClick={() => setSelectedMode(m.id as QuizMode)}
                          className={`p-4 rounded-2xl text-left transition-all border-2 ${selectedMode === m.id ? 'bg-accent border-accent shadow-xl' : 'bg-white/5 border-transparent hover:border-white/20'}`}
                        >
                          <p className={`font-black ${selectedMode === m.id ? 'text-white' : 'text-gray-300'}`}>{m.label}</p>
                          <p className={`text-[10px] ${selectedMode === m.id ? 'text-white/80' : 'text-gray-400'}`}>{m.desc}</p>
                        </button>
                      ))}
                   </div>
                </div>
              </div>

              {/* Category Grid */}
              <div className="lg:col-span-2">
                <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Selecciona una Categoría</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className={`p-6 rounded-[2rem] text-center transition-all border-2 group relative overflow-hidden ${selectedCategory === null ? 'bg-white/10 border-accent shadow-2xl' : 'bg-white/5 border-transparent hover:bg-white/10'}`}
                    >
                      <span className="relative z-10 font-black text-white">Todas las Frases</span>
                      {selectedCategory === null && <div className="absolute inset-0 bg-accent/20 blur-xl"></div>}
                    </button>
                    {categories.filter(c => !['Estudiadas', 'Aprendidas'].includes(c)).map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`p-6 rounded-[2rem] text-center transition-all border-2 ${selectedCategory === cat ? 'bg-white/10 border-accent shadow-2xl' : 'bg-white/5 border-transparent hover:bg-white/10'}`}
                      >
                        <span className="font-black text-white">{cat}</span>
                      </button>
                    ))}
                  </div>

                  <div className="mt-12">
                    <button
                      onClick={handleStartQuiz}
                      className="w-full bg-accent text-white py-6 rounded-[2rem] font-black text-xl shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                      <AcademicCapIcon className="w-8 h-8" />
                      ¡EMPEZAR ENTRENAMIENTO!
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <QuizContainer 
            category={selectedCategory} 
            mode={selectedMode} 
            onExit={handleExitQuiz} 
          />
        )}

      </div>
    </PageContainer>
  );
}