import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import Flashcard from '@/components/Flashcard';
import PageContainer from '@/components/layout/PageContainer';

const FeatureCard = ({ title, description }: { title: string, description: string }) => (
  <div className="bg-white/20 p-6 rounded-lg shadow-lg text-center">
    <h3 className="text-xl font-bold mb-2">{title}</h3>
    <p>{description}</p>
  </div>
);

export default function Flashcards() {
  const { frases, loadFrases, frasesLoaded, categories } = useAppStore();
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
      const hasText = phrase.es && phrase.en;
      const matchesCategory = selectedCategory === 'all' || phrase.categoria === selectedCategory;
      return hasText && matchesCategory;
    });
  }, [frases, selectedCategory]);

  useEffect(() => {
    // Reset index when filters change
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
      <div className="text-white">
        {/* Hero Section */}
        <section className="bg-primary py-20 px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="mb-4 text-4xl">🃏</div>
            <h1 className="text-5xl font-bold mb-4">Módulo de Flashcards</h1>
            <p className="text-xl mb-8">Memoriza vocabulario y frases de forma rápida y efectiva.</p>
            <button
              onClick={() => setShowWelcome(false)}
              className="bg-accent hover:bg-accent-dark text-white font-bold py-3 px-8 rounded-full text-lg transition duration-300"
            >
              Empezar a Estudiar
            </button>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-accent py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-12">¿Qué encontrarás aquí?</h2>
            <div className="grid md:grid-cols-1 gap-8">
              <FeatureCard
                title="Tarjetas Interactivas"
                description="Voltea las tarjetas para ver la traducción y escuchar la pronunciación. Una forma clásica y probada de aprender nuevo vocabulario."
              />
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-primary-dark py-4 text-center text-sm">
          <p>© 2025 HostellinglésApp. Todos los derechos reservados.</p>
        </footer>
      </div>
    );
  }

  if (!frasesLoaded) {
    return (
      <PageContainer title="Flashcards">
        <p>Cargando frases...</p>
      </PageContainer>
    );
  }

  if (filteredFrases.length === 0) {
    return (
      <PageContainer title="Flashcards">
        <p>No hay frases disponibles para la categoría seleccionada.</p>
      </PageContainer>
    );
  }

  const currentPhrase = filteredFrases[currentPhraseIndex];

  return (
    <PageContainer title="Flashcards">
      <select
        className="w-full p-2 border border-gray-300 rounded-md mb-4 dark:bg-gray-700 dark:text-white dark:border-gray-600"
        value={selectedCategory}
        onChange={(e) => setSelectedCategory(e.target.value)}
      >
        {displayCategories.map(category => (
          <option key={category} value={category}>
            {category === 'all' ? 'Todas las categorías' : category}
          </option>
        ))}
      </select>

      <div className="w-full max-w-md mb-6 relative z-0">
        <Flashcard phrase={currentPhrase} />
      </div>

      <div className="flex justify-between w-full max-w-md relative z-10">
        <button
          onClick={handlePrev}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-md text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          Anterior
        </button>
        <button
          onClick={handleShuffle}
          className="px-4 py-2 bg-accent text-white rounded-md hover:bg-accent-dark"
        >
          Aleatorio
        </button>
        <button
          onClick={handleNext}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
        >
          Siguiente
        </button>
      </div>
    </PageContainer>
  );
}
