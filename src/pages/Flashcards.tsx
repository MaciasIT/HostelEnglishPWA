import React, { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import Flashcard from '@/components/Flashcard';
import PageContainer from '@/components/layout/PageContainer';
import CollapsibleSection from '@/components/CollapsibleSection';
import VoiceSettings from '@/components/VoiceSettings';
import ModuleIntro from '@/components/ModuleIntro';
import { Square2StackIcon } from '@heroicons/react/24/outline';

export default function Flashcards() {
  const { frases, loadFrases, frasesLoaded, categories, setPhraseSetting } = useAppStore();
  const phraseSettings = useAppStore((state) => state.prefs.phraseSettings);
  const targetLanguage = useAppStore(state => state.prefs.targetLanguage);

  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showWelcome, setShowWelcome] = useState(true);

  useEffect(() => {
    if (!frasesLoaded) {
      loadFrases();
    }
  }, [frasesLoaded, loadFrases]);

  const displayCategories = ['all', ...categories];

  const filteredFrases = useMemo(() => {
    return frases.filter(phrase => {
      const hasText = phrase.es && (targetLanguage === 'eu' ? phrase.eu : phrase.en);
      const matchesCategory = selectedCategory === 'all' || phrase.categoria === selectedCategory;
      return hasText && matchesCategory;
    });
  }, [frases, selectedCategory, targetLanguage]);

  useEffect(() => {
    setCurrentPhraseIndex(0);
  }, [filteredFrases]);

  const handleNext = () => {
    setCurrentPhraseIndex((prevIndex) => (prevIndex + 1) % filteredFrases.length);
  };

  const handlePrev = () => {
    setCurrentPhraseIndex((prevIndex) =>
      prevIndex === 0 ? filteredFrases.length - 1 : prevIndex - 1
    );
  };

  const handleShuffle = () => {
    const shuffledIndex = Math.floor(Math.random() * filteredFrases.length);
    setCurrentPhraseIndex(shuffledIndex);
  };

  if (showWelcome) {
    return (
      <PageContainer>
        <ModuleIntro
          title={targetLanguage === 'eu' ? 'Flashcards Modulua' : 'Módulo de Flashcards'}
          description={targetLanguage === 'eu'
            ? 'Ikasi hiztegia eta esaldiak modu azkar eta eraginkorrean karta interaktiboekin. Bikaina ostalaritzaren sektoreko gako-terminoak errepasatzeko.'
            : 'Memoriza vocabulario y frases de forma rápida y efectiva con tarjetas interactivas. Ideal para repasar términos clave del sector hostelero.'
          }
          icon={Square2StackIcon}
          onStart={() => setShowWelcome(false)}
          stats={[
            { label: targetLanguage === 'eu' ? 'Txartelak' : 'Tarjetas', value: frases.length },
            { label: targetLanguage === 'eu' ? 'Kategoriak' : 'Categorías', value: categories.length },
            { label: targetLanguage === 'eu' ? 'Metodoa' : 'Método', value: targetLanguage === 'eu' ? 'Errepikapena' : 'Repetición' }
          ]}
        />
      </PageContainer>
    );
  }

  if (!frasesLoaded) {
    return (
      <PageContainer title="Flashcards">
        <div className="flex flex-col items-center justify-center p-20">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-400">{targetLanguage === 'eu' ? 'Hiztegia kargatzen...' : 'Cargando vocabulario...'}</p>
        </div>
      </PageContainer>
    );
  }

  if (filteredFrases.length === 0) {
    return (
      <PageContainer title="Flashcards">
        <div className="text-center py-20 px-4">
          <p className="text-xl text-gray-400 mb-6">
            {targetLanguage === 'eu' ? 'Ez dago txartelik erabilgarri hautapen honetarako.' : 'No hay tarjetas disponibles para esta selección.'}
          </p>
          <button
            onClick={() => setSelectedCategory('all')}
            className="bg-accent text-white px-8 py-3 rounded-2xl font-bold"
          >
            {targetLanguage === 'eu' ? 'Ikusi kategoria guztiak' : 'Ver todas las categorías'}
          </button>
        </div>
      </PageContainer>
    );
  }

  const currentPhrase = filteredFrases[currentPhraseIndex];

  return (
    <PageContainer title="Flashcards">
      <div className="max-w-md mx-auto w-full flex flex-col items-center">
        <div className="w-full mb-8">
          <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2 font-black">
            {targetLanguage === 'eu' ? 'KATEGORIA' : 'Categoría'}
          </label>
          <select
            className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold appearance-none shadow-xl focus:ring-2 focus:ring-accent outline-none transition-all"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {displayCategories.map(category => (
              <option key={category} value={category} className="bg-primary-dark text-white">
                {category === 'all' ? (targetLanguage === 'eu' ? 'Kategoria guztiak' : 'Todas las categorías') : category}
              </option>
            ))}
          </select>
        </div>

        <div className="w-full mb-10 relative perspective-1000">
          <Flashcard phrase={currentPhrase} />
        </div>

        <div className="grid grid-cols-3 gap-4 w-full mb-12">
          <button
            onClick={handlePrev}
            className="p-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold hover:bg-white/10 active:scale-95 transition-all text-sm uppercase tracking-tighter"
          >
            {targetLanguage === 'eu' ? 'Aurrekoa' : 'Anterior'}
          </button>
          <button
            onClick={handleShuffle}
            className="p-4 bg-accent text-white rounded-2xl font-bold hover:brightness-110 active:scale-95 transition-all shadow-lg text-sm uppercase tracking-tighter"
          >
            {targetLanguage === 'eu' ? 'Nahastu' : 'Mezclar'}
          </button>
          <button
            onClick={handleNext}
            className="p-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold hover:bg-white/10 active:scale-95 transition-all text-sm uppercase tracking-tighter"
          >
            {targetLanguage === 'eu' ? 'Hurrengoa' : 'Siguiente'}
          </button>
        </div>

        <div className="w-full">
          <CollapsibleSection title={targetLanguage === 'eu' ? 'Ahots Ezarpenak' : 'Ajustes de Voz'}>
            <VoiceSettings
              settings={phraseSettings}
              onSettingChange={setPhraseSetting}
              showTitle={false}
            />
          </CollapsibleSection>
        </div>

        <div className="mt-8 text-center text-gray-500 text-sm">
          {targetLanguage === 'eu' ? 'Txartela' : 'Tarjeta'} {currentPhraseIndex + 1} / {filteredFrases.length}
        </div>
      </div>
    </PageContainer>
  );
}
