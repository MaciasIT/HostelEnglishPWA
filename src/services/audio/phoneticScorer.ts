/**
 * Motor de evaluación fonética (FC-05).
 *
 * Evalúa la calidad de la respuesta oral del alumno frente a la frase objetivo:
 *  1. fonemiza ambas (objetivo y transcripción ASR) con el G2P ligero;
 *  2. alinea las secuencias con DTW (`alignPhonemes`) usando costes informados
 *     por el catálogo de errores hispanohablantes;
 *  3. calcula cuatro puntuaciones compuestas (0–100): Accuracy, Completeness,
 *     Fluency y Prosody, más una nota final ponderada;
 *  4. diagnostica los errores típicos (tensas/laxas, b/v, th, elisión final…).
 *
 * Fluency y Prosody son *proxies estructurales* calculados sobre el camino de
 * alineación (inserciones y concordancia de acento léxico). Las fórmulas
 * acústicas completas del plan (varianza de duración, contorno de pitch) exigen
 * marcas temporales por fonema que el ASR actual aún no entrega (ver
 * `docs/plan-2026/04_CAPA_IA_Y_AUDIO_2026.md` §4.2); el contrato de entrada es
 * extensible con esos datos sin cambiar la API de puntuación.
 */

import { isConsonant, isVowel, tokenizeWords, type Phoneme } from './phoneme';
import { englishWordToPhonemes } from './englishG2P';
import { basqueWordToPhonemes } from './basqueG2P';
import { phonemize, type ScoringLanguage } from './phonemizer';
import { alignPhonemes, type AlignmentStep } from './dtw';
import {
  DELETION_COST,
  FINAL_ELIDABLE,
  INSERTION_COST,
  findConfusion,
  substitutionCost,
  type ErrorCategory,
} from './pronunciationCatalog';

export type { ScoringLanguage, ErrorCategory };

/** Diagnóstico accionable de un error de pronunciación detectado. */
export interface PronunciationIssue {
  ruleId: string;
  category: ErrorCategory;
  /** Fonema esperado (objetivo). */
  expected: string;
  /** Fonema oído (o vacío para elisiones). */
  heard: string;
  /** Feedback en español. */
  message: string;
  /** Par de palabras mínimo que ilustra el contraste (opcional). */
  example?: string;
}

/** Puntuaciones compuestas 0–100. */
export interface PhoneticScores {
  accuracy: number;
  completeness: number;
  fluency: number;
  prosody: number;
}

export interface PhoneticScoreResult extends PhoneticScores {
  /** Nota final ponderada 0–100. */
  composite: number;
  /** Distancia DTW bruta (sin normalizar). */
  distance: number;
  targetPhonemes: number;
  heardPhonemes: number;
  /** Fonemas objetivo correctamente realizados (matches exactos). */
  matchedTargetPhonemes: number;
  substitutions: number;
  insertions: number;
  deletions: number;
  issues: PronunciationIssue[];
}

export interface ScorePronunciationOptions {
  /** Máximo de diagnósticos a devolver (por defecto 6, deduplicados). */
  maxIssues?: number;
}

const WEIGHTS = { accuracy: 0.4, completeness: 0.3, fluency: 0.15, prosody: 0.15 };

function clamp01(value: number): number {
  return Math.min(100, Math.max(0, value));
}

/** Palabras → fonemas del objetivo, registrando qué fonemas finalizan palabra. */
function phonemizeTarget(
  target: string,
  language: ScoringLanguage,
): { phonemes: Phoneme[]; wordFinalConsonants: Set<number> } {
  const wordFn = language === 'en' ? englishWordToPhonemes : basqueWordToPhonemes;
  const words = tokenizeWords(target);
  const phonemes: Phoneme[] = [];
  const wordFinalConsonants = new Set<number>();

  for (const word of words) {
    const ph = wordFn(word);
    const base = phonemes.length;
    for (let k = ph.length - 1; k >= 0; k -= 1) {
      if (isConsonant(ph[k].symbol)) {
        wordFinalConsonants.add(base + k);
        break;
      }
    }
    phonemes.push(...ph);
  }

  return { phonemes, wordFinalConsonants };
}

/** Prosody estructural: concordancia del acento léxico entre vocales alineadas. */
function computeProsody(
  target: readonly Phoneme[],
  heard: readonly Phoneme[],
  path: readonly AlignmentStep[],
): number {
  let alignedVowels = 0;
  let stressOk = 0;

  for (const step of path) {
    if (step.op === 'insert' || step.op === 'delete') continue;
    if (step.i < 0 || step.j < 0) continue;
    if (!isVowel(target[step.i].symbol) || !isVowel(heard[step.j].symbol)) continue;
    alignedVowels += 1;
    if (target[step.i].stress === heard[step.j].stress) stressOk += 1;
  }

  if (alignedVowels === 0) return 100; // sin evidencia vocálica → neutral
  return clamp01((100 * stressOk) / alignedVowels);
}

/** Construye diagnósticos a partir del camino de alineación (solo inglés). */
function detectIssues(
  path: readonly AlignmentStep[],
  target: readonly Phoneme[],
  heard: readonly Phoneme[],
  wordFinalConsonants: ReadonlySet<number>,
  maxIssues: number,
): PronunciationIssue[] {
  const issues: PronunciationIssue[] = [];
  const seen = new Set<string>();

  for (const step of path) {
    if (issues.length >= maxIssues) break;

    if (step.op === 'substitute' && step.i >= 0 && step.j >= 0) {
      const expected = target[step.i].symbol;
      const got = heard[step.j].symbol;
      const rule = findConfusion(expected, got);
      if (!rule) continue;
      if (seen.has(rule.id)) continue;
      seen.add(rule.id);
      issues.push({
        ruleId: rule.id,
        category: rule.category,
        expected,
        heard: got,
        message: rule.message,
        example: rule.example,
      });
      continue;
    }

    if (step.op === 'delete' && step.i >= 0) {
      const dropped = target[step.i].symbol;
      if (!isConsonant(dropped)) continue;
      const isFinal = wordFinalConsonants.has(step.i);
      const id = isFinal ? `final-elision-${dropped}` : `elision-${dropped}`;
      if (seen.has(id)) continue;

      if (isFinal && FINAL_ELIDABLE.has(dropped)) {
        seen.add(id);
        issues.push({
          ruleId: id,
          category: 'final-elision',
          expected: dropped,
          heard: '',
          message: `Consonante final /${dropped}/ no pronunciada (elisión típica en -ed / -s).`,
        });
      } else if (!seen.has(`elision-${dropped}`)) {
        seen.add(`elision-${dropped}`);
        issues.push({
          ruleId: `elision-${dropped}`,
          category: 'consonant-elision',
          expected: dropped,
          heard: '',
          message: `Consonante /${dropped}/ no pronunciada.`,
        });
      }
    }
  }

  return issues;
}

/**
 * Puntúa la pronunciación del alumno.
 *
 * @param target     Frase que el alumno debía decir.
 * @param transcript Texto transcrito por el ASR (lo que realmente dijo).
 * @param language   Idioma de la frase ('en' | 'eu').
 */
export function scorePronunciation(
  target: string,
  transcript: string,
  language: ScoringLanguage,
  options: ScorePronunciationOptions = {},
): PhoneticScoreResult {
  const maxIssues = options.maxIssues ?? 6;

  const targetInfo = phonemizeTarget(target, language);
  const targetPhonemes = targetInfo.phonemes;
  const heardPhonemes = phonemize(transcript, language);

  const result = alignPhonemes(targetPhonemes, heardPhonemes, {
    substitution: (x, y) => substitutionCost(x.symbol, y.symbol),
    insertion: () => INSERTION_COST,
    deletion: () => DELETION_COST,
  });

  // Degenerado: objetivo y oído vacíos → nada que evaluar (nota neutra perfecta).
  if (targetPhonemes.length === 0 && heardPhonemes.length === 0) {
    return {
      accuracy: 100, completeness: 100, fluency: 100, prosody: 100, composite: 100,
      distance: 0, targetPhonemes: 0, heardPhonemes: 0, matchedTargetPhonemes: 0,
      substitutions: 0, insertions: 0, deletions: 0, issues: [],
    };
  }

  const targetLen = targetPhonemes.length;
  const heardLen = heardPhonemes.length;

  // Accuracy: distancia de edición normalizada por la longitud de la referencia
  // (WER-style). Un fonema erróneo en una frase corta pesa proporcionalmente más
  // que en una larga, como en la percepción humana.
  const accuracy = targetLen === 0 ? 100 : clamp01(100 * (1 - result.distance / targetLen));

  // Completeness: % de fonemas objetivo *correctamente* realizados (matches).
  const matchedTarget = result.matches;
  const completeness = targetLen === 0 ? 100 : clamp01((100 * matchedTarget) / targetLen);

  // Fluency (proxy): penaliza inserciones (sonidos extra/disfluencias). Sin habla
  // transcrita no hay evidencia de fluidez → 0 (no inflar una respuesta vacía).
  const fluency = heardLen === 0 ? 0 : clamp01(100 * (1 - result.insertions / heardLen));

  // Prosody (proxy): concordancia del acento léxico entre vocales alineadas.
  const prosody = heardLen === 0 ? 0 : computeProsody(targetPhonemes, heardPhonemes, result.path);

  // Nota final: Fluency y Prosody miden la *entrega*; solo aportan crédito en
  // proporción al contenido correctamente pronunciado (un "dog" fluido para
  // "ship" no suma puntos de fluidez sobre el objetivo).
  const contentRatio = completeness / 100;
  const composite = clamp01(
    WEIGHTS.accuracy * accuracy +
      WEIGHTS.completeness * completeness +
      WEIGHTS.fluency * fluency * contentRatio +
      WEIGHTS.prosody * prosody * contentRatio,
  );

  const issues =
    language === 'en'
      ? detectIssues(result.path, targetPhonemes, heardPhonemes, targetInfo.wordFinalConsonants, maxIssues)
      : [];

  return {
    accuracy,
    completeness,
    fluency,
    prosody,
    composite,
    distance: result.distance,
    targetPhonemes: targetLen,
    heardPhonemes: heardLen,
    matchedTargetPhonemes: matchedTarget,
    substitutions: result.substitutions,
    insertions: result.insertions,
    deletions: result.deletions,
    issues,
  };
}