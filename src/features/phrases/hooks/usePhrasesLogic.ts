import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { shuffle } from '@/utils/shuffle';

export function usePhrasesLogic() {
  const {
    frases,
    loadFrases,
    progress,
    advancePhraseProgress,
    categories,
    setActivePhraseSet,
    phraseSettings,
    setPhraseSetting
  } = useAppStore((state) => ({
    frases: state.frases,
    loadFrases: state.loadFrases,
    progress: state.progress,
    advancePhraseProgress: state.advancePhraseProgress,
    categories: state.categories,
    setActivePhraseSet: state.setActivePhraseSet,
    phraseSettings: state.prefs.phraseSettings,
    setPhraseSetting: state.setPhraseSetting,
  }));

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showWelcome, setShowWelcome] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [activePhrases, setActivePhrases] = useState<any[]>([]);

  useEffect(() => {
    if (frases.length === 0) loadFrases();
    return () => window.speechSynthesis.cancel();
  }, [frases.length, loadFrases]);

  const filteredFrases = useMemo(() => {
    return frases.filter(phrase => {
      const phraseEs = phrase.es || '';
      const phraseEn = phrase.en || '';
      const phraseEu = phrase.eu || '';
      const matchesSearch = phraseEs.toLowerCase().includes(searchTerm.toLowerCase()) ||
        phraseEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
        phraseEu.toLowerCase().includes(searchTerm.toLowerCase());

      const progressLevel = progress[phrase.id] || 0;
      let matchesCategory = false;

      switch (selectedCategory) {
        case 'all':
          matchesCategory = true;
          break;
        case 'Nuevas':
          matchesCategory = progressLevel === 0;
          break;
        case 'Estudiadas':
          matchesCategory = progressLevel === 1;
          break;
        case 'Aprendidas':
          matchesCategory = progressLevel === 2;
          break;
        default:
          matchesCategory = phrase.categoria === selectedCategory;
          break;
      }

      return matchesCategory && matchesSearch;
    });
  }, [frases, searchTerm, selectedCategory, progress]);

  const startStudySession = useCallback((size: number | 'all') => {
    const phrasesToStudy = shuffle([...filteredFrases]);
    const sessionSize = size === 'all' ? phrasesToStudy.length : size;
    const subset = phrasesToStudy.slice(0, sessionSize);
    setActivePhrases(subset);
    setActivePhraseSet(subset);
    setCurrentIndex(0);
    setIsSessionActive(true);
  }, [filteredFrases, setActivePhraseSet]);

  const endStudySession = useCallback(() => {
    setIsSessionActive(false);
    setActivePhraseSet([]);
    setCurrentIndex(0);
  }, [setActivePhraseSet]);

  const goToNext = useCallback(() => {
    setCurrentIndex(prev => (prev + 1) % activePhrases.length);
  }, [activePhrases.length]);

  const goToPrev = useCallback(() => {
    setCurrentIndex(prev => (prev - 1 + activePhrases.length) % activePhrases.length);
  }, [activePhrases.length]);

  return {
    state: {
      searchTerm,
      selectedCategory,
      showWelcome,
      currentIndex,
      isSessionActive,
      activePhrases,
      filteredFrases,
      progress,
      categories,
      phraseSettings
    },
    actions: {
      setSearchTerm,
      setSelectedCategory,
      setShowWelcome,
      setCurrentIndex,
      startStudySession,
      endStudySession,
      advancePhraseProgress,
      setPhraseSetting,
      goToNext,
      goToPrev
    }
  };
}
