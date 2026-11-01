/**
 * Fluidez Laboral: media ponderada de velocidad de respuesta, precisión
 * fonética y tasa de resolución en roleplays. Todas las salidas en 0–100.
 */
export interface FluencyInputs {
  /** Segundos medios por frase. */
  avgSecondsPerPhrase?: number | null;
  /** Precisión fonética 0–100. */
  phoneticAccuracy?: number | null;
  /** Roleplays resueltos / intentados. */
  roleplaysResolved?: number;
  roleplaysAttempted?: number;
}

export const FLUENCY_WEIGHTS = { speed: 0.3, accuracy: 0.4, roleplay: 0.3 } as const;
export const FAST_SECONDS = 2;
export const SLOW_SECONDS = 12;

export type FluencyLevel = 'A2' | 'B1' | 'B2';

export interface FluencyReport {
  score: number;
  speedScore: number | null;
  accuracyScore: number | null;
  roleplayScore: number | null;
  level: FluencyLevel;
  /** Pesos efectivos tras renormalizar los componentes disponibles. */
  weights: { speed: number; accuracy: number; roleplay: number };
}

const clamp = (n: number, min = 0, max = 100) => Math.min(max, Math.max(min, n));

/** ≤2s → 100, ≥12s → 0, lineal entre medias. */
export function speedToScore(seconds: number): number {
  if (!Number.isFinite(seconds) || seconds < 0) return 0;
  return Math.round(clamp(((SLOW_SECONDS - seconds) / (SLOW_SECONDS - FAST_SECONDS)) * 100));
}

export function fluencyLevel(score: number): FluencyLevel {
  if (score >= 80) return 'B2';
  if (score >= 60) return 'B1';
  return 'A2';
}

export function calculateFluency(input: FluencyInputs): FluencyReport {
  const speedScore =
    input.avgSecondsPerPhrase != null && Number.isFinite(input.avgSecondsPerPhrase)
      ? speedToScore(input.avgSecondsPerPhrase)
      : null;
  const accuracyScore =
    input.phoneticAccuracy != null && Number.isFinite(input.phoneticAccuracy)
      ? Math.round(clamp(input.phoneticAccuracy))
      : null;
  const attempted = input.roleplaysAttempted ?? 0;
  const roleplayScore =
    attempted > 0
      ? Math.round(clamp(((input.roleplaysResolved ?? 0) / attempted) * 100))
      : null;

  const parts: [keyof typeof FLUENCY_WEIGHTS, number | null][] = [
    ['speed', speedScore],
    ['accuracy', accuracyScore],
    ['roleplay', roleplayScore],
  ];
  const active = parts.filter(([, v]) => v !== null);
  const totalW = active.reduce((s, [k]) => s + FLUENCY_WEIGHTS[k], 0);
  const weights = { speed: 0, accuracy: 0, roleplay: 0 };
  let score = 0;
  if (totalW > 0) {
    for (const [k, v] of active) {
      weights[k] = FLUENCY_WEIGHTS[k] / totalW;
      score += weights[k] * (v as number);
    }
  }
  score = Math.round(score);
  return { score, speedScore, accuracyScore, roleplayScore, level: fluencyLevel(score), weights };
}
