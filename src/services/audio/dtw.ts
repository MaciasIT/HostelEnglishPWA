/**
 * Alineación dinámica de secuencias fonéticas (DTW) — FC-05.
 *
 * Alinea la secuencia de fonemas *esperados* (frase objetivo) con la secuencia
 * *oída* (transcripción ASR fonemizada), permitiendo sustitución, inserción y
 * eliminación de fonemas mediante programación dinámica. Es el caso de DTW sobre
 * símbolos (no sobre series temporales): el "warping" permite que una secuencia
 * se estire/contraiga respecto de la otra para alinear fonemas homólogos.
 *
 * El coste de sustitución es inyectado por el catálogo de errores
 * hispanohablantes (`pronunciationCatalog`) para que las confusiones típicas
 * (b/v, θ/s, iː/ɪ…) sean "perdonables" y a la vez detectables, en lugar de
 * penalizarse como errores totales.
 *
 * Módulo puro y genérico: no depende de ningún idioma concreto.
 */

import type { Phoneme } from './phoneme';

export type AlignmentOp = 'match' | 'substitute' | 'insert' | 'delete';

/** Paso del camino óptimo de alineación. */
export interface AlignmentStep {
  op: AlignmentOp;
  /** Índice en la secuencia A (objetivo); `-1` si es una inserción. */
  i: number;
  /** Índice en la secuencia B (oída); `-1` si es una eliminación. */
  j: number;
}

export interface DTWCosts {
  /** Coste de alinear x (fonema objetivo) contra y (fonema oído). */
  substitution: (x: Phoneme, y: Phoneme) => number;
  /** Coste de insertar un fonema extra en la secuencia oída. */
  insertion: () => number;
  /** Coste de eliminar un fonema objetivo (no pronunciado). */
  deletion: () => number;
}

export interface DTWResult {
  distance: number;
  path: AlignmentStep[];
  matches: number;
  substitutions: number;
  insertions: number;
  deletions: number;
}

/**
 * Calcula el camino de alineación de coste mínimo entre `a` (objetivo) y `b`
 * (oída) y sus costes agregados.
 */
export function alignPhonemes(a: readonly Phoneme[], b: readonly Phoneme[], costs: DTWCosts): DTWResult {
  const m = a.length;
  const n = b.length;

  const INF = Number.POSITIVE_INFINITY;
  const dp: number[][] = new Array(m + 1).fill(0).map(() => new Array<number>(n + 1).fill(INF));
  dp[0][0] = 0;
  for (let i = 1; i <= m; i += 1) dp[i][0] = dp[i - 1][0] + costs.deletion();
  for (let j = 1; j <= n; j += 1) dp[0][j] = dp[0][j - 1] + costs.insertion();

  for (let i = 1; i <= m; i += 1) {
    for (let j = 1; j <= n; j += 1) {
      const sub = dp[i - 1][j - 1] + costs.substitution(a[i - 1], b[j - 1]);
      const del = dp[i - 1][j] + costs.deletion();
      const ins = dp[i][j - 1] + costs.insertion();
      dp[i][j] = Math.min(sub, del, ins);
    }
  }

  const distance = dp[m][n];

  // Retroceso para reconstruir el camino y clasificar operaciones.
  const path: AlignmentStep[] = [];
  let i = m;
  let j = n;
  let matches = 0;
  let substitutions = 0;
  let insertions = 0;
  let deletions = 0;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0) {
      const subCost = dp[i - 1][j - 1] + costs.substitution(a[i - 1], b[j - 1]);
      if (Math.abs(dp[i][j] - subCost) < 1e-9) {
        const same = a[i - 1].symbol === b[j - 1].symbol;
        path.push({ op: same ? 'match' : 'substitute', i: i - 1, j: j - 1 });
        if (same) matches += 1;
        else substitutions += 1;
        i -= 1;
        j -= 1;
        continue;
      }
    }
    if (i > 0) {
      const delCost = dp[i - 1][j] + costs.deletion();
      if (Math.abs(dp[i][j] - delCost) < 1e-9) {
        path.push({ op: 'delete', i: i - 1, j: -1 });
        deletions += 1;
        i -= 1;
        continue;
      }
    }
    if (j > 0) {
      path.push({ op: 'insert', i: -1, j: j - 1 });
      insertions += 1;
      j -= 1;
      continue;
    }
    // Caso límite defensivo (no debería ocurrir): retroceder sin clasificar.
    if (i > 0) i -= 1;
    else j -= 1;
  }

  path.reverse();
  return { distance, path, matches, substitutions, insertions, deletions };
}