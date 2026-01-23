import React, { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import PhraseCard from '@/components/PhraseCard';
import VoiceSettings from '@/components/VoiceSettings';
import CollapsibleSection from '@/components/CollapsibleSection';
import { ArrowLeftIcon, ArrowRightIcon, XCircleIcon } from '@heroicons/react/24/solid';
import { shuffle } from '@/utils/shuffle';
import PageContainer from '@/components/layout/PageContainer';

const FeatureCard = ({ title, description }: { title: string, description: string }) => (
  <div className="bg-white/20 p-6 rounded-lg shadow-lg text-center">
    <h3 className="text-xl font-bold mb-2">{title}</h3>
    <p>{description}</p>
  </div>
);

export default function Frases() {
  // Zustand Store
  const {
    frases,
    loadFrases,
    progress,
    advancePhraseProgress,
    categories,
    activePhraseSet,
    setActivePhraseSet,
  } = useAppStore();

  const { phraseSettings, setPhraseSetting } = useAppStore((state) => ({
    phraseSettings: state.prefs.phraseSettings,
    setPhraseSetting: state.setPhraseSetting,
  }));

  // Local State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showWelcome, setShowWelcome] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  // This state controls the two-phase UI: selection view vs. study session view.
  const [isSessionActive, setIsSessionActive] = useState(false);

  // Effects
  useEffect(() => {
    if (frases.length === 0) {
      loadFrases();
    }
    return () => window.speechSynthesis.cancel();
  }, [frases.length, loadFrases]);

  useEffect(() => {
    setCurrentIndex(0);
    setIsSessionActive(false);
    setActivePhraseSet([]);
  }, [searchTerm, selectedCategory, setActivePhraseSet]);

  // Memoized Data
  const displayCategories = ['all', ...categories];

  const filteredFrases = useMemo(() => {
    return frases.filter(phrase => {
      const phraseEs = phrase.es || '';
      const phraseEn = phrase.en || '';
      const matchesSearch = phraseEs.toLowerCase().includes(searchTerm.toLowerCase()) ||
        phraseEn.toLowerCase().includes(searchTerm.toLowerCase());

      const progressLevel = progress[Number(phrase.id)] || 0;
      let matchesCategory = false;

      switch (selectedCategory) {
        case 'all':
          matchesCategory = progressLevel === 0;
          break;
        case 'Estudiadas':
          matchesCategory = progressLevel === 1;
          break;
        case 'Aprendidas':
          matchesCategory = progressLevel === 2;
          break;
        default:
          matchesCategory = phrase.categoria === selectedCategory && progressLevel === 0;
          break;
      }

      return matchesCategory && matchesSearch;
    });
  }, [frases, searchTerm, selectedCategory, progress]);

  // Handlers
  const handleNext = () => {
    const limit = activePhraseSet.length;
    setCurrentIndex((prevIndex) => (prevIndex + 1) % limit);
  };

  const handlePrev = () => {
    const limit = activePhraseSet.length;
    setCurrentIndex((prevIndex) => (prevIndex - 1 + limit) % limit);
  };

  const startStudySession = (size: number | 'all') => {
    const phrasesToStudy = shuffle([...filteredFrases]);
    const sessionSize = size === 'all' ? phrasesToStudy.length : size;
    setActivePhraseSet(phrasesToStudy.slice(0, sessionSize));
    setCurrentIndex(0);
    setIsSessionActive(true);
  };

  const endStudySession = () => {
    setIsSessionActive(false);
    setActivePhraseSet([]);
    setCurrentIndex(0);
  };

  const currentPhrase = isSessionActive ? activePhraseSet[currentIndex] : null;

  // Render Welcome
  if (showWelcome) {
    return (
      <div className="text-white">
        <section className="bg-primary py-20 px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <img src={`${import.meta.env.BASE_URL}icons/icono.png`} alt="HostelEnglish Logo" className="mx-auto mb-4 w-32 h-32" />
            <h1 className="text-5xl font-bold mb-4">Módulo de Frases</h1>
            <p className="text-xl mb-8">Aprende y practica frases clave para el día a día en la hostelería.</p>
            <button
              onClick={() => setShowWelcome(false)}
              className="bg-accent hover:bg-accent-dark text-white font-bold py-3 px-8 rounded-full text-lg transition duration-300"
            >
              Empezar a Aprender
            </button>
          </div>
        </section>
        <section className="bg-accent py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-12">¿Qué encontrarás aquí?</h2>
            <div className="grid md:grid-cols-1 gap-8">
              <FeatureCard
                title="Frases Esenciales"
                description="Encuentra una amplia selección de frases útiles para comunicarte con clientes en inglés. Filtra por categoría y busca frases específicas para cada situación."
              />
            </div>
          </div>
        </section>
        <footer className="bg-primary-dark py-4 text-center text-sm">
          <p>© {new Date().getFullYear()} HostellinglésApp. Todos los derechos reservados.</p>
        </footer>
      </div>
    );
  }

  // Main Render
  return (
    <PageContainer title="Módulo de Frases">
      {!isSessionActive && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 mb-4">
            <input
              type="text"
              placeholder="Buscar frase..."
              className="w-full p-2 border rounded-md bg-primary-dark border-primary-dark text-white placeholder-gray-400 text-sm sm:text-base"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              id="category-select"
              className="w-full p-2 border rounded-md bg-primary-dark border-primary-dark text-white text-sm sm:text-base"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {displayCategories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'Nuevas' : category}
                </option>
              ))}
            </select>
          </div>
          <CollapsibleSection title="Ajustes de Voz">
            <VoiceSettings settings={phraseSettings} onSettingChange={setPhraseSetting} showTitle={false} />
          </CollapsibleSection>
        </>
      )}

      <div className="flex-grow flex flex-col items-center justify-center w-full mt-4">
        {isSessionActive && currentPhrase ? (
          // --- Study Session View ---
          // This view is active when a user has started a study session.
          // It displays one phrase at a time with navigation controls.
          <>
            <div className="w-full max-w-xl sm:max-w-2xl md:max-w-3xl mb-4">
              <PhraseCard
                key={currentPhrase.id}
                phrase={currentPhrase}
                onAdvanceProgress={advancePhraseProgress}
                progressLevel={progress[Number(currentPhrase.id)] || 0}
              />
            </div>

            <div className="flex justify-between items-center w-full max-w-xl sm:max-w-2xl md:max-w-3xl gap-4">
              <button
                onClick={handlePrev}
                className="p-4 rounded-full bg-accent hover:bg-accent-dark text-white text-lg"
                aria-label="Frase anterior"
              >
                <ArrowLeftIcon className="h-6 w-6" />
              </button>
              <span className="text-white text-lg font-semibold">
                {currentIndex + 1} / {activePhraseSet.length}
              </span>
              <button
                onClick={handleNext}
                className="p-4 rounded-full bg-accent hover:bg-accent-dark text-white text-lg"
                aria-label="Siguiente frase"
              >
                <ArrowRightIcon className="h-6 w-6" />
              </button>
            </div>
            <button
              onClick={endStudySession}
              className="mt-6 flex items-center gap-2 text-sm text-gray-300 hover:text-white"
            >
              <XCircleIcon className="h-5 w-5" />
              Finalizar Sesión
            </button>
          </>
        ) : (
          // --- Selection View ---
          // This is the default view where users can see filter results and choose a session size.
          <div className="text-center text-white bg-white/10 p-8 rounded-lg w-full max-w-xl sm:max-w-2xl md:max-w-3xl">
            {filteredFrases.length > 0 ? (
              <>
                <p className="text-2xl font-bold mb-4">{filteredFrases.length} frases encontradas</p>
                <p className="mb-6">Elige cuántas quieres estudiar en esta sesión:</p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <button onClick={() => startStudySession(10)} className="px-6 py-3 rounded-md bg-accent hover:bg-accent-dark text-white font-semibold disabled:bg-gray-600" disabled={filteredFrases.length < 1}>Estudiar 10</button>
                  <button onClick={() => startStudySession(25)} className="px-6 py-3 rounded-md bg-accent hover:bg-accent-dark text-white font-semibold disabled:bg-gray-600" disabled={filteredFrases.length < 10}>Estudiar 25</button>
                  <button onClick={() => startStudySession('all')} className="px-6 py-3 rounded-md bg-accent hover:bg-accent-dark text-white font-semibold disabled:bg-gray-600" disabled={filteredFrases.length < 1}>Estudiar Todas</button>
                </div>
              </>
            ) : (
              <>
                <p className="text-xl">No se encontraron frases que coincidan con tu búsqueda.</p>
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setSearchTerm('');
                  }}
                  className="mt-4 px-4 py-2 rounded-md bg-accent text-white"
                >
                  Mostrar todas las frases nuevas
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
