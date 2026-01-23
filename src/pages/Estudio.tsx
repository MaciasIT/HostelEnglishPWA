import React, { useState, useEffect, useMemo } from 'react';
import { useAppStore, Phrase } from '@/store/useAppStore';
import PageContainer from '@/components/layout/PageContainer';
import ModuleIntro from '@/components/ModuleIntro';
import { AcademicCapIcon, BookOpenIcon, StarIcon } from '@heroicons/react/24/outline';
import PhraseCard from '@/components/PhraseCard';

export default function Estudio() {
  const { frases, categories, progress, advancePhraseProgress, frasesLoaded, loadFrases } = useAppStore();
  const [showWelcome, setShowWelcome] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!frasesLoaded) loadFrases();
  }, [frasesLoaded, loadFrases]);

  const filteredFrases = useMemo(() => {
    if (!selectedCategory) return [];
    return frases.filter(p => p.categoria === selectedCategory);
  }, [frases, selectedCategory]);

  const stats = useMemo(() => {
    const total = frases.length;
    const learned = Object.values(progress).filter(v => v === 2).length;
    return { total, learned };
  }, [frases, progress]);

  if (showWelcome) {
    return (
      <PageContainer>
        <ModuleIntro
          title="Módulo de Estudio"
          description="Aprende paso a paso con lecciones estructuradas por situaciones reales del sector hostelero."
          icon={BookOpenIcon}
          onStart={() => setShowWelcome(false)}
          stats={[
            { label: 'Lecciones', value: categories.length },
            { label: 'Dominio', value: `${Math.round((stats.learned / stats.total) * 100) || 0}%` },
            { label: 'Modo', value: 'Guiado' }
          ]}
        />
      </PageContainer>
    );
  }

  if (!selectedCategory) {
    return (
      <PageContainer title="Elige una Lección">
        <div className="max-w-4xl mx-auto py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {categories.filter(c => c !== 'Estudiadas' && c !== 'Aprendidas').map((cat, idx) => {
              const catPhrases = frases.filter(p => p.categoria === cat);
              const learnedInCat = catPhrases.filter(p => progress[p.id] === 2).length;
              const percent = Math.round((learnedInCat / catPhrases.length) * 100);

              return (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setCurrentIndex(0);
                  }}
                  className="bg-white/5 border border-white/10 p-8 rounded-[2rem] text-left hover:bg-white/10 transition-all group flex flex-col"
                >
                  <div className="flex justify-between items-start mb-6 w-full">
                    <div className="p-3 bg-accent/20 rounded-xl group-hover:scale-110 transition-transform">
                      <AcademicCapIcon className="w-6 h-6 text-accent" />
                    </div>
                    <span className="text-[10px] uppercase font-black tracking-widest text-gray-500 bg-white/5 px-3 py-1 rounded-full">
                      {catPhrases.length} frases
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-4">{cat}</h3>
                  <div className="mt-auto w-full">
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-gray-400">Progreso</span>
                      <span className="text-accent font-bold">{percent}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-accent" style={{ width: `${percent}%` }}></div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </PageContainer>
    );
  }

  const currentPhrase = filteredFrases[currentIndex];

  return (
    <PageContainer title={`Estudiando: ${selectedCategory}`}>
      <div className="max-w-2xl mx-auto flex flex-col items-center">
        <div className="w-full flex justify-between items-center mb-10">
          <button
            onClick={() => setSelectedCategory(null)}
            className="text-gray-400 hover:text-white transition-all text-sm font-bold flex items-center gap-2"
          >
            ← Cambiar Lección
          </button>
          <div className="px-4 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-gray-300 font-bold">
            {currentIndex + 1} / {filteredFrases.length}
          </div>
        </div>

        {currentPhrase && (
          <div className="w-full mb-12 animate-in fade-in zoom-in duration-500">
            <PhraseCard
              phrase={currentPhrase}
              onAdvanceProgress={advancePhraseProgress}
              progressLevel={progress[currentPhrase.id] || 0}
            />
          </div>
        )}

        <div className="flex gap-6 w-full max-w-sm">
          <button
            onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
            className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-black hover:bg-white/10 disabled:opacity-30"
            disabled={currentIndex === 0}
          >
            ANTERIOR
          </button>
          <button
            onClick={() => setCurrentIndex(prev => Math.min(filteredFrases.length - 1, prev + 1))}
            className="flex-1 py-4 bg-accent text-white rounded-2xl font-black hover:brightness-110 disabled:opacity-30 shadow-xl"
            disabled={currentIndex === filteredFrases.length - 1}
          >
            SIGUIENTE
          </button>
        </div>

        <div className="mt-16 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 p-8 rounded-[2rem] border border-yellow-500/20 w-full text-center">
          <StarIcon className="w-8 h-8 text-yellow-500 mx-auto mb-4" />
          <h4 className="text-white font-bold mb-2">Consejo de Estudio</h4>
          <p className="text-sm text-gray-400">
            Repite la frase en voz alta después de escucharla. La memoria muscular de la boca es clave para hablar con fluidez.
          </p>
        </div>
      </div>
    </PageContainer>
  );
}