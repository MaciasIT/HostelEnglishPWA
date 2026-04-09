import React, { useState } from 'react';
import { useFlashcardsLogic } from '@/features/flashcards/hooks/useFlashcardsLogic';
import FlashcardItem from '@/features/flashcards/components/FlashcardItem';
import FlashcardControls from '@/features/flashcards/components/FlashcardControls';
import PageContainer from '@/components/layout/PageContainer';
import CollapsibleSection from '@/components/CollapsibleSection';
import VoiceSettings from '@/components/VoiceSettings';
import ModuleIntro from '@/components/ModuleIntro';
import { Square2StackIcon } from '@heroicons/react/24/outline';

const Flashcards: React.FC = () => {
  const [showWelcome, setShowWelcome] = useState(true);
  const { state, actions } = useFlashcardsLogic();

  if (showWelcome) {
    return (
      <PageContainer>
        <ModuleIntro
          title="Módulo de Flashcards"
          description="Memoriza vocabulario y frases de forma rápida y efectiva con tarjetas interactivas. Ideal para repasar términos clave del sector hostelero."
          icon={Square2StackIcon}
          onStart={() => setShowWelcome(false)}
          stats={[
            { label: 'Tarjetas', value: state.filteredFrases.length },
            { label: 'Categorías', value: state.categories.length },
            { label: 'Método', value: 'Repetición' }
          ]}
        />
      </PageContainer>
    );
  }

  if (!state.frasesLoaded) {
    return (
      <PageContainer title="Flashcards">
        <div className="flex flex-col items-center justify-center p-20" role="status" aria-live="polite">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-400">Cargando vocabulario...</p>
        </div>
      </PageContainer>
    );
  }

  if (state.filteredFrases.length === 0) {
    return (
      <PageContainer title="Flashcards">
        <div className="text-center py-20 px-4">
          <p className="text-xl text-gray-400 mb-6 font-medium">
            No hay tarjetas disponibles para esta selección.
          </p>
          <button
            onClick={() => actions.setSelectedCategory('all')}
            className="bg-accent text-white px-8 py-3 rounded-2xl font-bold shadow-lg hover:brightness-110 active:scale-95 transition-all"
            aria-label="Volver a mostrar todas las categorías"
          >
            Ver todas las categorías
          </button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Flashcards">
      <div className="max-w-md mx-auto w-full flex flex-col items-center animate-fade-in">
        <div className="w-full mb-8">
          <label 
            htmlFor="category-select"
            className="block text-xs uppercase tracking-widest text-gray-400 mb-2 font-bold"
          >
            Categoría
          </label>
          <select
            id="category-select"
            className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold appearance-none shadow-xl focus:ring-2 focus:ring-accent outline-none transition-all cursor-pointer"
            value={state.selectedCategory}
            onChange={(e) => actions.setSelectedCategory(e.target.value)}
          >
            <option value="all" className="bg-primary-dark text-white">Todas las categorías</option>
            {state.categories.map(category => (
              <option key={category} value={category} className="bg-primary-dark text-white">
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="w-full mb-10 relative perspective-1000">
          {state.currentPhrase && (
            <FlashcardItem 
              phrase={state.currentPhrase}
              targetLanguage={state.targetLanguage}
              phraseSettings={state.phraseSettings}
            />
          )}
        </div>

        <FlashcardControls 
          onNext={actions.handleNext}
          onPrev={actions.handlePrev}
          onShuffle={actions.handleShuffle}
        />

        <div className="w-full">
          <CollapsibleSection title="Ajustes de Voz">
            <VoiceSettings
              settings={state.phraseSettings}
              onSettingChange={actions.setPhraseSetting}
              showTitle={false}
            />
          </CollapsibleSection>
        </div>

        <div 
          className="mt-8 text-center text-gray-400 text-xs font-bold uppercase tracking-widest"
          role="status"
          aria-live="polite"
        >
          Tarjeta {state.currentPhraseIndex + 1} de {state.totalFrases}
        </div>
      </div>
    </PageContainer>
  );
};

export default Flashcards;
