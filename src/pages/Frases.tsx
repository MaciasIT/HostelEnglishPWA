import React, { useState, useEffect, useMemo } from 'react';
// Cleanup global: cancela cualquier reproducción de voz al desmontar la pantalla
// (debe ir después del import)
import { useAppStore, Phrase } from '@/store/useAppStore';
import PhraseCard from '@/components/PhraseCard';
import BottomNav from '@/components/BottomNav';
import VoiceSettings from '@/components/VoiceSettings';

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

  const { phraseSettings, setPhraseSetting } = useAppStore((state) => ({
    phraseSettings: state.prefs.phraseSettings,
    setPhraseSetting: state.setPhraseSetting,
  }));

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const handlePlayAll = () => {
    const utterances = paginatedFrases.map(phrase => {
      const utterance = new SpeechSynthesisUtterance(phrase.en);
      utterance.lang = 'en-US';
      utterance.rate = phraseSettings.rate;
      utterance.pitch = phraseSettings.pitch;
      if (phraseSettings.voiceURI) {
        const voice = window.speechSynthesis.getVoices().find(v => v.voiceURI === phraseSettings.voiceURI);
        if (voice) {
          utterance.voice = voice;
        }
      }
      return utterance;
    });

    let currentIndex = 0;
    const speak = () => {
      if (currentIndex < utterances.length) {
        const currentUtterance = utterances[currentIndex];
        currentUtterance.onend = () => {
          currentIndex++;
          speak();
        };
        window.speechSynthesis.speak(currentUtterance);
      } else {
        setIsModalOpen(true);
      }
    };

    speak();
  };

  return (

    <div className="p-2 sm:p-4 pb-24 bg-primary text-white min-h-screen w-full max-w-full overflow-x-hidden">
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
              {category === 'all' ? 'Todas las categorías' : category}
            </option>
          ))}
        </select>
      </div>

      <VoiceSettings settings={phraseSettings} onSettingChange={setPhraseSetting} />


      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2 sm:gap-0">
        <p className="text-white text-sm sm:text-base">{filteredFrases.length} frases encontradas</p>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
          <button
            onClick={handlePlayAll}
            className="px-3 py-2 rounded-md bg-accent text-white text-sm sm:text-base w-full sm:w-auto"
          >
            Reproducir Todo
          </button>
          <div className="flex items-center">
            <label htmlFor="phrases-per-page" className="mr-2 text-white text-sm sm:text-base">Frases por página:</label>
            <select
              id="phrases-per-page"
              className="p-2 border rounded-md bg-primary-dark border-primary-dark text-white text-sm sm:text-base"
              value={phrasesPerPage}
              onChange={(e) => setPhrasesPerPage(Number(e.target.value))}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
          </div>
        </div>
      </div>

      {paginatedFrases.length === 0 && (
        <p className="text-center text-white">No se encontraron frases.</p>
      )}


      <div className="space-y-3">
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
        <div className="flex flex-wrap justify-center items-center mt-4 gap-2">
          <button
            onClick={() => setPhrasesCurrentPage(phrasesCurrentPage - 1)}
            disabled={phrasesCurrentPage === 1}
            className="px-3 py-2 rounded-md bg-primary-dark disabled:bg-gray-600 text-sm sm:text-base"
          >
            Anterior
          </button>
          <span className="text-white text-sm sm:text-base">
            Página {phrasesCurrentPage} de {totalPages}
          </span>
          <button
            onClick={() => setPhrasesCurrentPage(phrasesCurrentPage + 1)}
            disabled={phrasesCurrentPage === totalPages}
            className="px-3 py-2 rounded-md bg-primary-dark disabled:bg-gray-600 text-sm sm:text-base"
          >
            Siguiente
          </button>
        </div>
      )}
      
      <div className="flex justify-center mt-4">
        <button
          onClick={handleGoToHome}
          className="px-3 py-2 rounded-md bg-accent text-white text-sm sm:text-base w-full sm:w-auto"
        >
          Volver al inicio de Frases
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-primary-dark p-8 rounded-lg">
            <h2 className="text-xl font-bold text-white mb-4">¡Has completado la página!</h2>
            <div className="flex justify-around">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  if (phrasesCurrentPage < totalPages) {
                    setPhrasesCurrentPage(phrasesCurrentPage + 1);
                  }
                }}
                disabled={phrasesCurrentPage === totalPages}
                className="px-4 py-2 rounded-md bg-accent text-white disabled:bg-gray-600"
              >
                Siguiente Página
              </button>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  handleGoToHome();
                }}
                className="px-4 py-2 rounded-md bg-primary text-white"
              >
                Volver al inicio
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}