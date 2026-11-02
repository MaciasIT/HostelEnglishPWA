import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import PageContainer from '@/components/layout/PageContainer';
import CollapsibleSection from '@/components/CollapsibleSection';
import VoiceSettings from '@/components/VoiceSettings';
import ModuleIntro from '@/components/ModuleIntro';
import { AcademicCapIcon, BoltIcon } from '@heroicons/react/24/outline';
import QuizContainer from '@/features/quiz/QuizContainer';
import { QuizMode } from '@/features/quiz/types';
import { ROLE_LABELS } from '@/utils/roleFilter';

const MODES: { id: QuizMode; emoji: string; label: string }[] = [
  { id: 'multiple', emoji: '🔠', label: 'Múltiple' },
  { id: 'truefalse', emoji: '⚖️', label: 'V/F' },
  { id: 'scramble', emoji: '🧩', label: 'Ordenar' },
];

export default function Quiz() {
  const { loadFrases, frasesLoaded, categories, prefs, setPhraseSetting } = useAppStore();
  const phraseSettings = prefs.phraseSettings;
  const myRole = prefs.selectedRole ?? null;
  const myRoleLabel = myRole ? ROLE_LABELS[myRole] : 'General';

  const [quizActive, setQuizActive] = useState(false);
  const [selectedMode, setSelectedMode] = useState<QuizMode>('multiple');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [useRole, setUseRole] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);

  useEffect(() => {
    if (!frasesLoaded) {
      loadFrases();
    }
  }, [frasesLoaded, loadFrases]);

  const handleStartQuiz = () => {
    setUseRole(false);
    setQuizActive(true);
  };

  const handleQuickStart = () => {
    setSelectedCategory(null);
    setUseRole(true);
    setQuizActive(true);
  };

  const handleExitQuiz = () => {
    setQuizActive(false);
    setUseRole(false);
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

  const chip = (active: boolean) =>
    `px-4 min-h-11 rounded-full text-sm font-bold border transition-all ${
      active ? 'bg-accent border-accent text-primary' : 'bg-surface/5 border-border/10 text-secondary hover:bg-surface/10'
    }`;

  return (
    <PageContainer>
      <div className="max-w-xl mx-auto pb-4">
        {!quizActive ? (
          <div className="space-y-4 animate-in fade-in duration-500">
            <header>
              <h1 className="text-2xl font-black text-primary tracking-tighter">
                DESAFÍO <span className="text-accent-text">HOSTEL</span>
              </h1>
              <p className="text-tertiary text-sm">Selecciona tu especialidad y el tipo de entrenamiento que prefieres hoy.</p>
            </header>

            {/* Entrenamiento rápido: 1 tap */}
            <button
              type="button"
              onClick={handleQuickStart}
              className="w-full flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-accent/30 to-accent/10 border border-accent text-left active:scale-[0.98] transition-transform"
            >
              <BoltIcon className="w-8 h-8 text-accent-text shrink-0" aria-hidden="true" />
              <span className="min-w-0">
                <span className="block font-black text-primary">Entrenamiento Rápido: {myRoleLabel}</span>
                <span className="block text-xs text-tertiary">10 preguntas · modo {MODES.find((m) => m.id === selectedMode)?.label}</span>
              </span>
            </button>

            {/* Modos: segmented control */}
            <div role="radiogroup" aria-label="Modo de juego" className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-surface/10 border border-border/10">
              {MODES.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  role="radio"
                  aria-checked={selectedMode === m.id}
                  onClick={() => setSelectedMode(m.id)}
                  className={`min-h-12 rounded-xl text-sm font-black flex items-center justify-center gap-1.5 transition-all ${
                    selectedMode === m.id ? 'bg-accent text-primary shadow' : 'text-secondary hover:bg-surface/10'
                  }`}
                >
                  <span aria-hidden="true">{m.emoji}</span>
                  <span>{m.label}</span>
                </button>
              ))}
            </div>

            {/* Categorías: chips */}
            <section aria-label="Categoría">
              <h3 className="text-xs font-bold text-tertiary uppercase tracking-widest mb-2">Categoría</h3>
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                <button type="button" onClick={() => setSelectedCategory(null)} aria-pressed={selectedCategory === null} className={chip(selectedCategory === null)}>
                  Todas las Frases
                </button>
                {categories
                  .filter((c) => !['Estudiadas', 'Aprendidas'].includes(c))
                  .map((cat) => (
                    <button key={cat} type="button" onClick={() => setSelectedCategory(cat)} aria-pressed={selectedCategory === cat} className={chip(selectedCategory === cat)}>
                      {cat}
                    </button>
                  ))}
              </div>
            </section>

            <CollapsibleSection title="Configuración de Voz">
              <VoiceSettings settings={phraseSettings} onSettingChange={setPhraseSetting} />
            </CollapsibleSection>

            {/* CTA siempre visible (sobre la BottomNav en móvil) */}
            <div className="sticky bottom-24 lg:bottom-4 z-10">
              <button
                type="button"
                onClick={handleStartQuiz}
                className="w-full bg-accent text-primary py-4 rounded-2xl font-black text-lg shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                <AcademicCapIcon className="w-6 h-6" aria-hidden="true" />
                ¡EMPEZAR ENTRENAMIENTO!
              </button>
            </div>
          </div>
        ) : (
          <QuizContainer
            category={selectedCategory}
            mode={selectedMode}
            role={useRole ? myRole : null}
            onExit={handleExitQuiz}
          />
        )}
      </div>
    </PageContainer>
  );
}
