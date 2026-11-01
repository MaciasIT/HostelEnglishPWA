/**
 * Catálogo de errores habituales de hispanohablantes en inglés — FC-05.
 *
 * Doble función:
 *  1. **Costes de sustitución**: las confusiones típicas (b/v, θ/s, iː/ɪ…) se
 *     penalizan *menos* que una sustitución aleatoria, de modo que el DTW no
 *     trate un error de sonoridad como un fallo total, pero sigan detectándose.
 *  2. **Diagnóstico**: al trazar el camino de alineación, cada sustitución o
 *     elisión que coincide con un patrón del catálogo produce un
 *     `PronunciationIssue` con feedback accionable en español.
 */

import { featureSimilarity } from './phoneme';

export type ErrorCategory =
  | 'vowel-tenseness'
  | 'consonant-voice'
  | 'dental-fricative'
  | 'diphthong-reduction'
  | 'rhotic'
  | 'palatal-l'
  | 'final-elision'
  | 'consonant-elision';

export interface ConfusionRule {
  id: string;
  category: ErrorCategory;
  /** Fonema esperado (objetivo). */
  from: string;
  /** Fonema producido por el hispanohablante. */
  to: string;
  /** Feedback accionable en español. */
  message: string;
  /** Par de palabras mínimo que ilustra el contraste. */
  example: string;
  /** Coste de sustitución reducido (0..1). */
  cost: number;
}

export const MATCH_COST = 0;
export const SIMILAR_COST = 0.6;
export const DIFFERENT_COST = 1.0;
export const INSERTION_COST = 1.0;
export const DELETION_COST = 1.0;

/** Umbral de similitud de rasgos por encima del cual una sustitución se considera "cercana". */
const SIMILARITY_THRESHOLD = 0.4;

/** Fricativas y oclusivas finales típicamente elididas en el inglés hablado (-ed, -s). */
export const FINAL_ELIDABLE = new Set(['t', 'd', 's', 'z', 'k', 'p', 'b', 'ɡ', 'v', 'f', 'θ', 'ð', 'tʃ', 'dʒ']);

/** Reglas de confusión (sustitución) de hispanohablantes. */
export const HISPANOPHONE_CONFUSIONS: readonly ConfusionRule[] = [
  // --- Vocales tensas vs. laxas ----------------------------------------
  { id: 'vowel-i-lax-tensed', category: 'vowel-tenseness', from: 'ɪ', to: 'iː', message: 'Vocal /ɪ/ (corta, "ship") pronunciada larga/tensa como /iː/ ("sheep").', example: 'ship → sheep', cost: 0.2 },
  { id: 'vowel-i-tensed-lax', category: 'vowel-tenseness', from: 'iː', to: 'ɪ', message: 'Vocal /iː/ (larga, "sheep") pronunciada corta/laxa como /ɪ/ ("ship").', example: 'sheep → ship', cost: 0.2 },
  { id: 'vowel-u-lax-tensed', category: 'vowel-tenseness', from: 'ʊ', to: 'uː', message: 'Vocal /ʊ/ (corta, "foot") pronunciada larga/tensa como /uː/ ("food").', example: 'foot → food', cost: 0.2 },
  { id: 'vowel-u-tensed-lax', category: 'vowel-tenseness', from: 'uː', to: 'ʊ', message: 'Vocal /uː/ (larga, "food") pronunciada corta/laxa como /ʊ/ ("foot").', example: 'food → foot', cost: 0.2 },
  { id: 'vowel-a-lax-tensed', category: 'vowel-tenseness', from: 'æ', to: 'ɑː', message: 'Vocal /æ/ (abierta corta, "cat") pronunciada posterior/ larga como /ɑː/ ("cart").', example: 'cat → cart', cost: 0.2 },
  { id: 'vowel-a-tensed-lax', category: 'vowel-tenseness', from: 'ɑː', to: 'æ', message: 'Vocal /ɑː/ (larga, "cart") pronunciada corta como /æ/ ("cat").', example: 'cart → cat', cost: 0.2 },
  { id: 'vowel-o-lax-tensed', category: 'vowel-tenseness', from: 'ɒ', to: 'ɔː', message: 'Vocal /ɒ/ (corta, "lot") alargada como /ɔː/ ("laud").', example: 'lot → laud', cost: 0.2 },
  { id: 'vowel-e-lax-close', category: 'vowel-tenseness', from: 'e', to: 'eɪ', message: 'Vocal /e/ (corta, "bed") diptongada como /eɪ/ ("bayed").', example: 'bed → bayed', cost: 0.3 },
  // --- Consonantes oclusivas/fricativas (sonoridad) ---------------------
  { id: 'cons-v-as-b', category: 'consonant-voice', from: 'v', to: 'b', message: '/v/ fricativa labiodental pronunciada como /b/ oclusiva bilabial.', example: 'very → berry', cost: 0.25 },
  { id: 'cons-b-as-v', category: 'consonant-voice', from: 'b', to: 'v', message: '/b/ oclusiva pronunciada como /v/ fricativa.', example: 'berry → very', cost: 0.25 },
  { id: 'cons-z-as-s', category: 'consonant-voice', from: 'z', to: 's', message: '/z/ sonora pronunciada sorda como /s/.', example: 'is → "ees"', cost: 0.2 },
  { id: 'cons-s-as-z', category: 'consonant-voice', from: 's', to: 'z', message: '/s/ sorda pronunciada sonora como /z/.', example: 'sink → zink', cost: 0.2 },
  { id: 'cons-d-as-t', category: 'consonant-voice', from: 'd', to: 't', message: 'Oclusiva sonora /d/ final ensordecida como /t/ (típico en -ed).', example: 'booked → "bookt"', cost: 0.3 },
  // --- Fricativas dentales (th) ----------------------------------------
  { id: 'th-as-s', category: 'dental-fricative', from: 'θ', to: 's', message: '/θ/ dental pronunciada como /s/ alveolar ("seseo").', example: 'think → sink', cost: 0.3 },
  { id: 'th-as-t', category: 'dental-fricative', from: 'θ', to: 't', message: '/θ/ dental pronunciada como /t/ oclusiva.', example: 'three → tree', cost: 0.3 },
  { id: 'dh-as-d', category: 'dental-fricative', from: 'ð', to: 'd', message: '/ð/ dental sonora pronunciada como /d/ oclusiva.', example: 'that → "dat"', cost: 0.3 },
  { id: 'dh-as-z', category: 'dental-fricative', from: 'ð', to: 'z', message: '/ð/ dental sonora pronunciada como /z/ alveolar.', example: 'they → "zey"', cost: 0.3 },
  // --- Reducción de diptongos ------------------------------------------
  { id: 'dip-ei-as-e', category: 'diphthong-reduction', from: 'eɪ', to: 'e', message: 'Diptongo /eɪ/ monoptongado como /e/.', example: 'make → "mek"', cost: 0.35 },
  // --- Rótica ----------------------------------------------------------
  { id: 'r-as-tap', category: 'rhotic', from: 'ɹ', to: 'ɾ', message: '/ɹ/ inglesa pronunciada como vibrante simple alveolar /ɾ/.', example: 'room → vibrante simple', cost: 0.25 },
  { id: 'r-as-trill', category: 'rhotic', from: 'ɹ', to: 'r', message: '/ɹ/ inglesa pronunciada como vibrante múltiple /r/.', example: 'room → vibrante múltiple', cost: 0.25 },
  // --- Palatalización de l ---------------------------------------------
  { id: 'l-as-palatal', category: 'palatal-l', from: 'l', to: 'ʎ', message: '/l/ alveolar clara palatalizada como /ʎ/.', example: 'hotel → "ollel"', cost: 0.3 },
];

/** Índice `from→to` para búsqueda O(1) de sustituciones. */
const RULE_INDEX = new Map<string, ConfusionRule>(
  HISPANOPHONE_CONFUSIONS.map((r) => [`${r.from}→${r.to}`, r]),
);

/** Busca una regla de confusión directa `from→to` (o `null`). */
export function findConfusion(from: string, to: string): ConfusionRule | null {
  return RULE_INDEX.get(`${from}→${to}`) ?? null;
}

/**
 * Coste de sustitución entre dos fonemas:
 *  - idénticos → 0;
 *  - pareja del catálogo → coste reducido de la regla;
 *  - fonemas con rasgos cercanos → `SIMILAR_COST`;
 *  - resto → `DIFFERENT_COST`.
 */
export function substitutionCost(target: string, heard: string): number {
  if (target === heard) return MATCH_COST;
  const rule = findConfusion(target, heard);
  if (rule) return rule.cost;
  return featureSimilarity(target, heard) >= SIMILARITY_THRESHOLD ? SIMILAR_COST : DIFFERENT_COST;
}