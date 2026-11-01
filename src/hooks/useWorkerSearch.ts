import { useState, useEffect, useRef, useCallback } from 'react';
import type { Phrase, SearchResult } from '@/workers/searchWorker';
import { createSearchWorker } from '@/workers/workerFactory';

type UseWorkerSearchOptions = {
  phrases: Phrase[];
  progress: Record<string | number, number>;
  debounceMs?: number;
};

type UseWorkerSearchReturn = {
  results: SearchResult[];
  isSearching: boolean;
  error: string | null;
  metrics: {
    totalPhrases: number;
    retentionDistribution: Record<number, number>;
    avgRetention: number;
  } | null;
  search: (query: string, category?: string) => void;
  reset: () => void;
};

function computeMetrics(
  phrases: Phrase[],
  progress: Record<string | number, number>,
): {
  totalPhrases: number;
  retentionDistribution: Record<number, number>;
  avgRetention: number;
} {
  const distribution: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0 };
  let sum = 0;
  for (const phrase of phrases) {
    const level = progress[phrase.id] ?? 0;
    distribution[level] = (distribution[level] || 0) + 1;
    sum += level;
  }
  const avgRetention = phrases.length > 0 ? sum / phrases.length : 0;
  return { totalPhrases: phrases.length, retentionDistribution: distribution, avgRetention };
}

function searchSync(
  query: string,
  category?: string,
  phrases: Phrase[] = [],
  progress: Record<string | number, number> = {},
): SearchResult[] {
  const lowerQuery = query.toLowerCase().trim();
  if (!lowerQuery && !category) {
    return phrases.map((phrase) => {
      const level = progress[phrase.id] ?? 0;
      return {
        id: phrase.id,
        es: phrase.es,
        en: phrase.en,
        eu: phrase.eu,
        categoria: phrase.categoria,
        masteryLevel: level,
        retentionLabel: level === 0 ? 'Nueva' : level === 1 ? 'Estudiada' : level === 2 ? 'Aprendida' : 'Dominada',
        score: 1,
      };
    });
  }

  return phrases
    .filter((phrase) => {
      const matchesSearch =
        !lowerQuery ||
        phrase.es.toLowerCase().includes(lowerQuery) ||
        phrase.en.toLowerCase().includes(lowerQuery) ||
        (phrase.eu && phrase.eu.toLowerCase().includes(lowerQuery)) ||
        (phrase.categoria && phrase.categoria.toLowerCase().includes(lowerQuery));
      if (!matchesSearch) return false;
      const matchesCategory =
        !category || category === 'all' || phrase.categoria === category;
      return matchesCategory;
    })
    .map((phrase) => {
      const level = progress[phrase.id] ?? 0;
      const score = lowerQuery
        ? (phrase.es.toLowerCase().includes(lowerQuery) ? 1 : 0) +
          (phrase.en.toLowerCase().includes(lowerQuery) ? 0.5 : 0) +
          (phrase.eu && phrase.eu.toLowerCase().includes(lowerQuery) ? 0.3 : 0)
        : 0.5;
      return {
        id: phrase.id,
        es: phrase.es,
        en: phrase.en,
        eu: phrase.eu,
        categoria: phrase.categoria,
        masteryLevel: level,
        retentionLabel: level === 0 ? 'Nueva' : level === 1 ? 'Estudiada' : level === 2 ? 'Aprendida' : 'Dominada',
        score,
      };
    })
    .sort((a, b) => b.score - a.score);
}

export function useWorkerSearch({
  phrases,
  progress,
  debounceMs = 150,
}: UseWorkerSearchOptions): UseWorkerSearchReturn {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<{
    totalPhrases: number;
    retentionDistribution: Record<number, number>;
    avgRetention: number;
  } | null>(null);

  const workerRef = useRef<Worker | null>(null);
  const queryRef = useRef<string>('');
  const categoryRef = useRef<string | undefined>(undefined);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const phrasesRef = useRef(phrases);
  const progressRef = useRef(progress);
  const workerAvailableRef = useRef(false);

  useEffect(() => {
    phrasesRef.current = phrases;
  }, [phrases]);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    let isCancelled = false;

    const initWorker = () => {
      try {
        const WorkerClass = typeof globalThis.Worker === 'function' ? globalThis.Worker : undefined;
        if (!WorkerClass) {
          throw new Error('Worker not available');
        }
        const worker = createSearchWorker();

        worker.onmessage = (event) => {
          const msg = event.data;
          if (isCancelled) return;

          switch (msg.type) {
            case 'METRICS':
              setMetrics({
                totalPhrases: msg.totalPhrases,
                retentionDistribution: msg.retentionDistribution,
                avgRetention: msg.avgRetention,
              });
              break;
            case 'SEARCH_RESULT':
              if (msg.query === queryRef.current) {
                setResults(msg.results);
                setIsSearching(false);
                setError(null);
              }
              break;
            case 'READY':
              setIsSearching(false);
              break;
          }
        };

        worker.onerror = () => {
          if (!isCancelled) {
            setError('Error en el Worker de búsqueda');
            setIsSearching(false);
          }
        };

        worker.postMessage({
          type: 'INIT',
          phrases,
          progress,
        });

        workerRef.current = worker;
        workerAvailableRef.current = true;
        return worker;
      } catch {
        return null;
      }
    };

    const worker = initWorker();

    if (!worker) {
      // Fallback: calcular métricas inmediatamente
      setMetrics(computeMetrics(phrases, progress));
      workerAvailableRef.current = false;
    }

    return () => {
      isCancelled = true;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      worker?.terminate();
      workerRef.current = null;
      workerAvailableRef.current = false;
    };
  }, [phrases, progress]);

  const search = useCallback(
    (query: string, category?: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);

      queryRef.current = query;
      categoryRef.current = category;

      if (!query && !category) {
        setResults([]);
        return;
      }

      setIsSearching(true);
      setError(null);

      debounceRef.current = setTimeout(() => {
        if (workerRef.current && workerAvailableRef.current) {
          workerRef.current.postMessage({
            type: 'SEARCH_QUERY',
            query,
            category,
          });
        } else {
          // Fallback síncrono para entornos sin Worker (jsdom, tests)
          try {
            const results = searchSync(query, category, phrasesRef.current, progressRef.current);
            setResults(results);
            setIsSearching(false);
            setError(null);
          } catch (err) {
            setError('Búsqueda fallida en fallback');
            setIsSearching(false);
          }
        }
      }, debounceMs);
    },
    [debounceMs]
  );

  const reset = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    queryRef.current = '';
    categoryRef.current = undefined;
    setResults([]);
    setIsSearching(false);
    setError(null);
  }, []);

  return {
    results,
    isSearching,
    error,
    metrics,
    search,
    reset,
  };
}
