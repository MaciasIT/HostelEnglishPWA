import React, { useState, useEffect, useMemo } from 'react';
import { useAppStore, Phrase } from '@/store/useAppStore';
import PhraseCard from '@/components/PhraseCard';
import BottomNav from '@/components/BottomNav';

export default function Frases() {
  const {
    frases,
    loadFrases,
    progress,
    advancePhraseProgress,
    categories,
    phrasesCurrentPage,
    phrasesPerPage,
    setPhrasesCurrentPage,
    setPhrasesPerPage,
  } = useAppStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    if (frases.length === 0) {
      loadFrases();
    }
  }, [frases.length, loadFrases]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setPhrasesCurrentPage(1);
  }, [searchTerm, selectedCategory, setPhrasesCurrentPage]);

  const displayCategories = ['all', ...categories];

  const filteredFrases = useMemo(() => {
    const searchFilter = (phrase: Phrase) => {
      const phraseEs = phrase.es || '';
      const phraseEn = phrase.en || '';
      return phraseEs.toLowerCase().includes(searchTerm.toLowerCase()) ||
             phraseEn.toLowerCase().includes(searchTerm.toLowerCase());
    };

    if (selectedCategory === 'Estudiadas') {
      return frases.filter(phrase => progress[Number(phrase.id)] === 1 && searchFilter(phrase));
    }

    if (selectedCategory === 'Aprendidas') {
      return frases.filter(phrase => progress[Number(phrase.id)] === 2 && searchFilter(phrase));
    }

    return frases.filter(phrase => {
      const progressLevel = progress[Number(phrase.id)] || 0;
      if (progressLevel > 0) return false;

      const matchesCategory = selectedCategory === 'all' || phrase.categoria === selectedCategory;
      return matchesCategory && searchFilter(phrase);
    });
  }, [frases, searchTerm, selectedCategory, progress]);

  const paginatedFrases = useMemo(() => {
    const startIndex = (phrasesCurrentPage - 1) * phrasesPerPage;
    return filteredFrases.slice(startIndex, startIndex + phrasesPerPage);
  }, [filteredFrases, phrasesCurrentPage, phrasesPerPage]);

  const totalPages = Math.ceil(filteredFrases.length / phrasesPerPage);

  const handleGoToHome = () => {
    setSelectedCategory('all');
    setSearchTerm('');
    setPhrasesCurrentPage(1);
  };

  return (
    <div className="p-4 pb-20 bg-primary text-white min-h-screen">
      <h1 className="text-2xl font-bold mb-4 text-white">Frases</h1>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <input
          type="text"
          placeholder="Buscar frase..."
          className="w-full p-2 border rounded-md bg-primary-dark border-primary-dark text-white placeholder-gray-400"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          id="category-select"
          className="w-full p-2 border rounded-md bg-primary-dark border-primary-dark text-white"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          {displayCategories.map(category => (
            <option key={category} value={category}>
              {category === 'all' ? 'Todas las categorías' : category}
            </option>
          ))}
        </select>
      </div>

      <div className="flex justify-between items-center mb-4">
        <p className="text-white">{filteredFrases.length} frases encontradas</p>
        <div className="flex items-center">
          <label htmlFor="phrases-per-page" className="mr-2 text-white">Frases por página:</label>
          <select
            id="phrases-per-page"
            className="p-2 border rounded-md bg-primary-dark border-primary-dark text-white"
            value={phrasesPerPage}
            onChange={(e) => setPhrasesPerPage(Number(e.target.value))}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
          </select>
        </div>
      </div>

      {paginatedFrases.length === 0 && (
        <p className="text-center text-white">No se encontraron frases.</p>
      )}

      <div>
        {paginatedFrases.map(phrase => (
          <PhraseCard
            key={phrase.id}
            phrase={phrase}
            onAdvanceProgress={advancePhraseProgress}
            progressLevel={progress[Number(phrase.id)] || 0}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-4 space-x-4">
          <button
            onClick={() => setPhrasesCurrentPage(phrasesCurrentPage - 1)}
            disabled={phrasesCurrentPage === 1}
            className="px-4 py-2 rounded-md bg-primary-dark disabled:bg-gray-600"
          >
            Anterior
          </button>
          <span className="text-white">
            Página {phrasesCurrentPage} de {totalPages}
          </span>
          <button
            onClick={() => setPhrasesCurrentPage(phrasesCurrentPage + 1)}
            disabled={phrasesCurrentPage === totalPages}
            className="px-4 py-2 rounded-md bg-primary-dark disabled:bg-gray-600"
          >
            Siguiente
          </button>
        </div>
      )}
      
      <div className="flex justify-center mt-4">
          <button
            onClick={handleGoToHome}
            className="px-4 py-2 rounded-md bg-accent text-white"
          >
            Volver al inicio de Frases
          </button>
      </div>

      <BottomNav />
    </div>
  );
}