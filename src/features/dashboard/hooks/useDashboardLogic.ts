import { useMemo, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';

export function useDashboardLogic() {
  const { frases, progress, loadFrases, frasesLoaded, prefs } = useAppStore((state) => ({
    frases: state.frases,
    progress: state.progress,
    loadFrases: state.loadFrases,
    frasesLoaded: state.frasesLoaded,
    prefs: state.prefs,
  }));

  const targetLanguage = prefs.targetLanguage;

  useEffect(() => {
    if (!frasesLoaded) loadFrases();
  }, [frasesLoaded, loadFrases]);

  const stats = useMemo(() => {
    const total = frases.length;
    const studied = Object.values(progress).filter(v => v === 1).length;
    const learned = Object.values(progress).filter(v => v === 2).length;
    // Calculate progress: Learned = 100%, Studied = 50%
    const percent = total > 0 ? Math.round(((studied * 0.5 + learned) / total) * 100) : 0;
    return { total, studied, learned, percent };
  }, [frases, progress]);

  return {
    stats,
    targetLanguage
  };
}
