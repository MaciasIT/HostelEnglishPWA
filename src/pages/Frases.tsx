import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import PhraseCard from '@/components/PhraseCard';
import BottomNav from '@/components/BottomNav';

export default function Frases() {
  const { frases, loadFrases, progress, togglePhraseStudied, categories } = useAppStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    if (frases.length === 0) {
      loadFrases();
    }
  }, [frases.length, loadFrases]);

  const displayCategories = ['all', ...categories];

  const filteredFrases = frases.filter(phrase => {
    const phraseEs = phrase.es || '';
    const phraseEn = phrase.en || '';
    const matchesSearch = phraseEs.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          phraseEn.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || phrase.categoria === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-4 pb-20 bg-primary text-white min-h-screen">
      <h1 className="text-2xl font-bold mb-4 text-white">Frases</h1>

      <input
        type="text"
        placeholder="Buscar frase..."
        className="w-full p-2 border rounded-md mb-4 bg-primary-dark border-primary-dark text-white placeholder-gray-400"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <label htmlFor="category-select" className="block mb-2 text-sm font-medium text-white">Filtrar por categoría:</label>
      <select
        id="category-select"
        className="w-full p-2 border rounded-md mb-4 bg-primary-dark border-primary-dark text-white"
        value={selectedCategory}
        onChange={(e) => setSelectedCategory(e.target.value)}
      >
        {displayCategories.map(category => (
          <option key={category} value={category}>
            {category === 'all' ? 'Todas las categorías' : category}
          </option>
        ))}
      </select>

      <p className="text-white mb-4">{filteredFrases.length} frases encontradas</p>

      {filteredFrases.length === 0 && (
        <p className="text-center text-white">No se encontraron frases.</p>
      )}

      <div>
        {filteredFrases.map(phrase => (
          <PhraseCard
            key={phrase.id}
            phrase={phrase}
            onToggleStudied={togglePhraseStudied}
            isStudied={!!progress[phrase.id]}
          />
        ))}
      </div>

      <BottomNav />
    </div>
  );
}