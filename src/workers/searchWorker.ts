/// <reference lib="WebWorker" />

export type Phrase = {
  id: number | string;
  es: string;
  en: string;
  eu?: string;
  categoria?: string;
};

export type SearchResult = {
  id: number | string;
  es: string;
  en: string;
  eu?: string;
  categoria?: string;
  masteryLevel: number;
  retentionLabel: string;
  score: number;
};

export type WorkerMessage =
  | { type: 'INIT'; phrases: Phrase[]; progress: Record<string | number, number> }
  | { type: 'SEARCH_QUERY'; query: string; category?: string }
  | { type: 'UPDATE_PROGRESS'; progress: Record<string | number, number> };

export type WorkerResponse =
  | { type: 'SEARCH_RESULT'; results: SearchResult[]; query: string; latencyMs: number }
  | { type: 'METRICS'; totalPhrases: number; retentionDistribution: Record<number, number>; avgRetention: number }
  | { type: 'READY' };

const RETENTION_LABELS: Record<number, string> = {
  0: 'Nueva',
  1: 'Estudiada',
  2: 'Aprendida',
  3: 'Dominada',
};

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-záéíóúúüñ0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

function buildInvertedIndex(phrases: Phrase[]): Map<string, Set<number | string>> {
  const index = new Map<string, Set<number | string>>();
  for (const phrase of phrases) {
    const tokens = new Set<string>([
      ...tokenize(phrase.es),
      ...tokenize(phrase.en),
      ...tokenize(phrase.eu || ''),
      ...tokenize(phrase.categoria || ''),
    ]);
    for (const token of tokens) {
      let set = index.get(token);
      if (!set) {
        set = new Set<number | string>();
        index.set(token, set);
      }
      set.add(phrase.id);
    }
  }
  return index;
}

function computeMetrics(phrases: Phrase[], progress: Record<string | number, number>): {
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

function searchWithIndex(
  query: string,
  category?: string,
  phrases: Phrase[] = [],
  progress: Record<string | number, number> = {},
  index: Map<string, Set<number | string>> = new Map(),
): SearchResult[] {
  if (!query.trim() && !category) {
    return phrases.map((phrase) => {
      const level = progress[phrase.id] ?? 0;
      return {
        id: phrase.id,
        es: phrase.es,
        en: phrase.en,
        eu: phrase.eu,
        categoria: phrase.categoria,
        masteryLevel: level,
        retentionLabel: RETENTION_LABELS[level] || 'Nueva',
        score: 1,
      };
    });
  }

  const queryTokens = tokenize(query);
  if (queryTokens.length === 0 && !category) {
    return [];
  }

  const matchedIds = new Map<number | string, number>();
  for (const token of queryTokens) {
    const ids = index.get(token);
    if (ids) {
      for (const id of ids) {
        matchedIds.set(id, (matchedIds.get(id) || 0) + 1);
      }
    }
  }

  let results = phrases
    .filter((phrase) => {
      if (matchedIds.size === 0) return false;
      if (!matchedIds.has(phrase.id)) return false;
      if (category && category !== 'all' && phrase.categoria !== category) {
        return false;
      }
      return true;
    })
    .map((phrase) => {
      const level = progress[phrase.id] ?? 0;
      const tokenMatches = matchedIds.get(phrase.id) || 0;
      const maxTokens = queryTokens.length;
      const relevance = maxTokens > 0 ? tokenMatches / maxTokens : 0;
      return {
        id: phrase.id,
        es: phrase.es,
        en: phrase.en,
        eu: phrase.eu,
        categoria: phrase.categoria,
        masteryLevel: level,
        retentionLabel: RETENTION_LABELS[level] || 'Nueva',
        score: relevance,
      };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);

  if (results.length === 0 && category && category !== 'all') {
    results = phrases
      .filter((phrase) => phrase.categoria === category)
      .map((phrase) => {
        const level = progress[phrase.id] ?? 0;
        return {
          id: phrase.id,
          es: phrase.es,
          en: phrase.en,
          eu: phrase.eu,
          categoria: phrase.categoria,
          masteryLevel: level,
          retentionLabel: RETENTION_LABELS[level] || 'Nueva',
          score: 0.5,
        };
      });
  }

  return results;
}

const workerState = {
  phrases: [] as Phrase[],
  progress: {} as Record<string | number, number>,
  index: new Map<string, Set<number | string>>(),
};

self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const msg = event.data;
  switch (msg.type) {
    case 'INIT': {
      workerState.phrases = msg.phrases;
      workerState.progress = msg.progress;
      workerState.index = buildInvertedIndex(msg.phrases);
      const metrics = computeMetrics(msg.phrases, msg.progress);
      self.postMessage({ type: 'METRICS', ...metrics });
      self.postMessage({ type: 'READY' });
      break;
    }
    case 'SEARCH_QUERY': {
      const start = performance.now();
      const results = searchWithIndex(
        msg.query,
        msg.category,
        workerState.phrases,
        workerState.progress,
        workerState.index,
      );
      const latencyMs = performance.now() - start;
      self.postMessage({
        type: 'SEARCH_RESULT',
        results,
        query: msg.query,
        latencyMs,
      });
      break;
    }
    case 'UPDATE_PROGRESS': {
      workerState.progress = msg.progress;
      const metrics = computeMetrics(workerState.phrases, msg.progress);
      self.postMessage({ type: 'METRICS', ...metrics });
      break;
    }
  }
};
