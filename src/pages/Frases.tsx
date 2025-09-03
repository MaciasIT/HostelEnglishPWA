import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import PhraseCard from '@/components/PhraseCard';
import BottomNav from '@/components/BottomNav';
import useSpeech from '@/hooks/useSpeech';
import { useAudio } from '@/hooks/useAudio';

export default function Frases() {
  const { frases, loadFrases, progress, togglePhraseStudied } = useAppStore();
  const { speak, supported: speechSupported } = useSpeech();
  const { playAudio } = useAudio();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    if (frases.length === 0) {
      loadFrases();
    }
  }, [frases.length, loadFrases]);

  const categories = ['all', ...new Set(frases.map(f => f.categoria).filter(Boolean) as string[])];

  const filteredFrases = frases.filter(phrase => {
    const matchesSearch = phrase.es.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          phrase.en.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || phrase.categoria === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handlePlayAudio = (lang: 'es' | 'en', audioUrl?: string) => {
    const phraseText = lang === 'es' ? '' : ''; // Placeholder, will get actual text from phrase object
    if (speechSupported) {
      speak(phraseText, lang === 'es' ? 'es-ES' : 'en-US');
    } else if (audioUrl) {
      playAudio(audioUrl);
    } else {
      console.warn("No audio available and speech synthesis not supported.");
    }
  };

  return (
    <div className="p-4 pb-20">
      <h1 className="text-2xl font-bold mb-4">Frases</h1>

      <input
        type="text"
        placeholder="Buscar frase..."
        className="w-full p-2 border border-gray-300 rounded-md mb-4 dark:bg-gray-700 dark:text-white dark:border-gray-600"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

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

      <p className="text-gray-600 dark:text-gray-300 mb-4">{filteredFrases.length} frases encontradas</p>

      {filteredFrases.length === 0 && (
        <p className="text-center text-gray-500 dark:text-gray-400">No se encontraron frases.</p>
      )}

      <div>
        {filteredFrases.map(phrase => (
          <PhraseCard
            key={phrase.id}
            phrase={phrase}
            onToggleStudied={togglePhraseStudied}
            isStudied={!!progress[phrase.id]}
            onPlayAudio={(lang) => handlePlayAudio(lang, lang === 'es' ? phrase.audioEs : phrase.audioEn)}
          />
        ))}
      </div>

      <BottomNav />
    </div>
  );
}
