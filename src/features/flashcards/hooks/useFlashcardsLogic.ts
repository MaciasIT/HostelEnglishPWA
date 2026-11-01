import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { roleMatchesCategory } from '@/utils/roleFilter';
import type { RoleScope } from '@/components/RoleScopeTabs';

export function useFlashcardsLogic() {
  const { frases, loadFrases, frasesLoaded, categories, setPhraseSetting } = useAppStore();
  const phraseSettings = useAppStore((state) => state.prefs.phraseSettings);
  const targetLanguage = useAppStore(state => state.prefs.targetLanguage);

  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const selectedRole = useAppStore((state) => state.prefs.selectedRole);
  const [scope, setScope] = useState<RoleScope>('role');

  useEffect(() => {
    if (!frasesLoaded) {
      loadFrases();
    }
  }, [frasesLoaded, loadFrases]);

  const filteredFrases = useMemo(() => {
    return frases.filter(phrase => {
      const hasText = phrase.es && (targetLanguage === 'eu' ? phrase.eu : phrase.en);
      const matchesCategory = selectedCategory === 'all' || phrase.categoria === selectedCategory;
      const matchesRole = scope === 'all' || roleMatchesCategory(selectedRole, phrase.categoria);
      return hasText && matchesCategory && matchesRole;
    });
  }, [frases, selectedCategory, targetLanguage, scope, selectedRole]);

  // Reset index when filtration changes
  useEffect(() => {
    setCurrentPhraseIndex(0);
  }, [filteredFrases.length, selectedCategory]);

  const handleNext = useCallback(() => {
    if (filteredFrases.length === 0) return;
    setCurrentPhraseIndex((prevIndex) => (prevIndex + 1) % filteredFrases.length);
  }, [filteredFrases.length]);

  const handlePrev = useCallback(() => {
    if (filteredFrases.length === 0) return;
    setCurrentPhraseIndex((prevIndex) =>
      prevIndex === 0 ? filteredFrases.length - 1 : prevIndex - 1
    );
  }, [filteredFrases.length]);

  const handleShuffle = useCallback(() => {
    if (filteredFrases.length === 0) return;
    const shuffledIndex = Math.floor(Math.random() * filteredFrases.length);
    setCurrentPhraseIndex(shuffledIndex);
  }, [filteredFrases.length]);

  return {
    state: {
      frasesLoaded,
      categories,
      phraseSettings,
      targetLanguage,
      currentPhraseIndex,
      selectedCategory,
      selectedRole,
      scope,
      filteredFrases,
      currentPhrase: filteredFrases[currentPhraseIndex] || null,
      totalFrases: filteredFrases.length
    },
    actions: {
      setSelectedCategory,
      setScope,
      setCurrentPhraseIndex,
      handleNext,
      handlePrev,
      handleShuffle,
      setPhraseSetting
    }
  };
}
