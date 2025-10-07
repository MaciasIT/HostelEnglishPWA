import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore, Phrase } from '@/store/useAppStore';
import PhraseCard from '@/components/PhraseCard';
import VoiceSettings from '@/components/VoiceSettings';
import CollapsibleSection from '@/components/CollapsibleSection';
import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/solid';

const FeatureCard = ({ title, description }: { title: string, description: string }) => (
  <div className="bg-white/20 p-6 rounded-lg shadow-lg text-center">
    <h3 className="text-xl font-bold mb-2">{title}</h3>
    <p>{description}</p>
  </div>
);

export default function Frases() {
  const {
    frases,
    loadFrases,
    progress,
    advancePhraseProgress,
    categories,
  } = useAppStore();

  const { phraseSettings, setPhraseSetting } = useAppStore((state) => ({
    phraseSettings: state.prefs.phraseSettings,
    setPhraseSetting: state.setPhraseSetting,
  }));

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showWelcome, setShowWelcome] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (frases.length === 0) {
      loadFrases();
    }
    // Cancel speech synthesis on component unmount
    return () => window.speechSynthesis.cancel();
  }, [frases.length, loadFrases]);

  // Reset index when filters change
  useEffect(() => {
    setCurrentIndex(0);
  }, [searchTerm, selectedCategory]);

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

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % filteredFrases.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + filteredFrases.length) % filteredFrases.length);
  };
  
  const currentPhrase = filteredFrases[currentIndex];

  if (showWelcome) {
    return (
      <div className="text-white">
        <section className="bg-primary py-20 px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="mb-4 text-4xl">🗣️</div>
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
          <p>© 2025 HostellinglésApp. Todos los derechos reservados.</p>
        </footer>
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-4 pb-24 bg-primary text-white min-h-screen w-full max-w-full overflow-x-hidden flex flex-col">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 text-white">Frases</h1>

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
        <VoiceSettings settings={phraseSettings} onSettingChange={setPhraseSetting} />
      </CollapsibleSection>

      <div className="flex-grow flex flex-col items-center justify-center w-full">
        {filteredFrases.length > 0 ? (
          <>
            <div className="w-full max-w-2xl mb-4">
              <PhraseCard
                key={currentPhrase.id}
                phrase={currentPhrase}
                onAdvanceProgress={advancePhraseProgress}
                progressLevel={progress[Number(currentPhrase.id)] || 0}
              />
            </div>

            <div className="flex justify-between items-center w-full max-w-2xl">
              <button
                onClick={handlePrev}
                className="p-4 rounded-full bg-accent hover:bg-accent-dark text-white disabled:bg-gray-600"
                aria-label="Frase anterior"
              >
                <ArrowLeftIcon className="h-6 w-6" />
              </button>
              <span className="text-white text-lg font-semibold">
                {currentIndex + 1} / {filteredFrases.length}
              </span>
              <button
                onClick={handleNext}
                className="p-4 rounded-full bg-accent hover:bg-accent-dark text-white disabled:bg-gray-600"
                aria-label="Siguiente frase"
              >
                <ArrowRightIcon className="h-6 w-6" />
              </button>
            </div>
          </>
        ) : (
          <div className="text-center text-white bg-white/10 p-8 rounded-lg">
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
          </div>
        )}
      </div>
    </div>
  );
}
