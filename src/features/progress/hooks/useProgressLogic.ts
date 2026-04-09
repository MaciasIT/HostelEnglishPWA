import { useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';

export function useProgressLogic() {
  const { frases, progress, dailyActivity, achievements, prefs } = useAppStore((state) => ({
    frases: state.frases,
    progress: state.progress,
    dailyActivity: state.dailyActivity,
    achievements: state.achievements,
    prefs: state.prefs,
  }));

  const targetLanguage = prefs.targetLanguage;

  const stats = useMemo(() => {
    const total = frases.length;
    const studied = Object.values(progress).filter(v => v === 1).length;
    const learned = Object.values(progress).filter(v => v === 2).length;
    const pending = total - studied - learned;
    const progressPercent = total > 0 ? Math.round(((studied + learned * 2) / (total * 2)) * 100) : 0;

    return { total, studied, learned, pending, progressPercent };
  }, [frases, progress]);

  // Data for Daily Activity Chart
  const chartData = useMemo(() => {
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    return last7Days.map(date => ({
      date: date.split('-').slice(1).reverse().join('/'), // format DD/MM
      rawDate: date,
      count: dailyActivity[date] || 0
    }));
  }, [dailyActivity]);

  // Data for Categories Chart
  const categoryChartData = useMemo(() => {
    const data: Record<string, { total: number, learned: number }> = {};
    frases.forEach(phrase => {
      if (phrase.categoria) {
        if (!data[phrase.categoria]) data[phrase.categoria] = { total: 0, learned: 0 };
        data[phrase.categoria].total++;
        if (progress[phrase.id] === 2) data[phrase.categoria].learned++;
      }
    });

    return Object.entries(data)
      .map(([name, d]) => ({
        name,
        percent: Math.round((d.learned / d.total) * 100),
        learned: d.learned,
        total: d.total
      }))
      .sort((a, b) => b.percent - a.percent)
      .slice(0, 5);
  }, [frases, progress]);

  return {
    state: {
      stats,
      chartData,
      categoryChartData,
      achievements,
      targetLanguage
    }
  };
}
