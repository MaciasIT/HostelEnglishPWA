import React, { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import Flashcard from '@/components/Flashcard';

export default function Flashcards() {
  const { frases, loadFrases, frasesLoaded } = useAppStore();
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    if (!frasesLoaded) {
      loadFrases();
    }
  }, [frasesLoaded, loadFrases]);

  const categories = useMemo(() => {
    return ['all', ...new Set(frases.map(f => f.categoria).filter(Boolean) as string[])];
  }, [frases]);

  const filteredFrases = useMemo(() => {
    return frases.filter(phrase => {
      return selectedCategory === 'all' || phrase.categoria === selectedCategory;
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

  if (!frasesLoaded) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Flashcards</h1>
        <p>Cargando frases...</p>
      </div>
    );
  }

  if (filteredFrases.length === 0) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Flashcards</h1>
        <p>No hay frases disponibles para la categoría seleccionada.</p>
      </div>
    );
  }

  const currentPhrase = filteredFrases[currentPhraseIndex];

  return (
    <div className="p-4 pb-20 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-4">Flashcards</h1>

      <select
        className="w-full p-2 border border-gray-300 rounded-md mb-4 dark:bg-gray-700 dark:text-white dark:border-gray-600"
        value={selectedCategory}
        onChange={(e) => setSelectedCategory(e.target.value)}
      >
        {categories.map(category => (
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
          className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600"
        >
          Aleatorio
        </button>
        <button
          onClick={handleNext}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
