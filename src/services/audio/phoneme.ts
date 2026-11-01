/**
 * Modelo fonético compartido (FC-05).
 *
 * Define el tipo `Phoneme` y las tablas de rasgos distintivos usadas por:
 *  - los fonemizadores (`englishG2P`, `basqueG2P`) para emitir secuencias IPA;
 *  - el catálogo de errores hispanohablantes (`pronunciationCatalog`) para
 *    construir costes de sustitución informados por rasgos;
 *  - el alineador DTW (`dtw`) como coste por defecto entre símbolos.
 *
 * Es un módulo *puro* (sin dependencias) para poder testearlo y compartirlo sin
 * arrastrar runtimes de audio/browser.
 */

/**
 * Un fonema normalizado: símbolo IPA sin diacrítico de acento y nivel de acento
 * léxico separado (0 = sin acento, 1 = acento primario, 2 = secundario). Mantener
 * el acento en un canal aparte permite comparar fonemas por identidad sin que el
 * acento contamine el coste de edición, y a la vez disponer de la información
 * prosódica (FC-05, métrica Prosody).
 */
export interface Phoneme {
  /** Símbolo IPA normalizado (sin diacríticos de acento ni longitud auxiliar). */
  symbol: string;
  /** Acento léxico: 0 (átono), 1 (primario), 2 (secundario). */
  stress: 0 | 1 | 2;
}

/** Secuencia fonética normalizada. */
export type PhonemeSequence = readonly Phoneme[];

/* ------------------------------------------------------------------ */
/* Rasgos distintivos                                                   */
/* ------------------------------------------------------------------ */

export type PhonemeCategory = 'vowel' | 'consonant';

interface BaseFeatures {
  category: PhonemeCategory;
}

export interface VowelFeatures extends BaseFeatures {
  category: 'vowel';
  /** Altura: close > close-mid > open-mid > open. */
  height: 'close' | 'close-mid' | 'open-mid' | 'open';
  /** Posterioridad. */
  backness: 'front' | 'central' | 'back';
  /** Tensa (larga/cerrada) vs. laxa (corta/abierta). */
  tensed: boolean;
  /** Redondeada. */
  rounded: boolean;
  /** Diptongo. */
  diphthong: boolean;
}

export interface ConsonantFeatures extends BaseFeatures {
  category: 'consonant';
  manner: 'stop' | 'fricative' | 'affricate' | 'nasal' | 'liquid' | 'approximant';
  place: 'bilabial' | 'labiodental' | 'dental' | 'alveolar' | 'postalveolar' | 'palatal' | 'velar' | 'glottal';
  /** Sonora vs. sorda. */
  voice: boolean;
}

export type PhonemeFeatures = VowelFeatures | ConsonantFeatures;

const V = (height: VowelFeatures['height'], backness: VowelFeatures['backness'], tensed: boolean, rounded: boolean, diphthong = false): VowelFeatures => ({
  category: 'vowel', height, backness, tensed, rounded, diphthong,
});

const C = (manner: ConsonantFeatures['manner'], place: ConsonantFeatures['place'], voice: boolean): ConsonantFeatures => ({
  category: 'consonant', manner, place, voice,
});

/**
 * Rasgos de las vocales del inglés (referencia RP, coherente con el documento
 * `docs/plan-2026/04_CAPA_IA_Y_AUDIO_2026.md`, que usa /ɒ/ y /əʊ/).
 */
export const ENGLISH_VOWELS: Record<string, VowelFeatures> = {
  'iː': V('close', 'front', true, false),
  ɪ: V('close', 'front', false, false),
  e: V('open-mid', 'front', false, false),
  æ: V('open', 'front', false, false),
  'ɑː': V('open', 'back', true, false),
  ɒ: V('open', 'back', false, true),
  'ɔː': V('open-mid', 'back', true, true),
  ʊ: V('close', 'back', false, true),
  'uː': V('close', 'back', true, true),
  ʌ: V('open-mid', 'back', false, false),
  'ɜː': V('open-mid', 'central', true, false),
  ə: V('close-mid', 'central', false, false),
  // Diptongos
  eɪ: V('close-mid', 'front', true, false, true),
  aɪ: V('open', 'front', true, false, true),
  ɔɪ: V('open-mid', 'back', true, true, true),
  əʊ: V('close-mid', 'back', true, true, true),
  aʊ: V('open', 'back', true, false, true),
  ɪə: V('close', 'front', true, false, true),
  eə: V('open-mid', 'front', true, false, true),
  ʊə: V('close', 'back', true, true, true),
};

/** Rasgos de las consonantes del inglés (RP). */
export const ENGLISH_CONSONANTS: Record<string, ConsonantFeatures> = {
  p: C('stop', 'bilabial', false),
  b: C('stop', 'bilabial', true),
  t: C('stop', 'alveolar', false),
  d: C('stop', 'alveolar', true),
  k: C('stop', 'velar', false),
  ɡ: C('stop', 'velar', true),
  f: C('fricative', 'labiodental', false),
  v: C('fricative', 'labiodental', true),
  θ: C('fricative', 'dental', false),
  ð: C('fricative', 'dental', true),
  s: C('fricative', 'alveolar', false),
  z: C('fricative', 'alveolar', true),
  ʃ: C('fricative', 'postalveolar', false),
  ʒ: C('fricative', 'postalveolar', true),
  h: C('fricative', 'glottal', false),
  m: C('nasal', 'bilabial', true),
  n: C('nasal', 'alveolar', true),
  ŋ: C('nasal', 'velar', true),
  l: C('liquid', 'alveolar', true),
  ɹ: C('approximant', 'postalveolar', true),
  j: C('approximant', 'palatal', true),
  w: C('approximant', 'velar', true),
  tʃ: C('affricate', 'postalveolar', false),
  dʒ: C('affricate', 'postalveolar', true),
};

/**
 * Rasgos de los fonemas del euskera usados por `basqueG2P`. El euskera no tiene
 * contraste de longitud vocálica (todas las vocales son "tensas" a efectos del
 * modelo) y su acento es distinto del inglés; se modela con rasgos compartidos
 * para que la similitud genérica funcione, pero la sustitución relevante se
 * resuelve por identidad de símbolo.
 */
export const BASQUE_PHONEMES: Record<string, PhonemeFeatures> = {
  a: V('open', 'central', true, false),
  e: V('close-mid', 'front', true, false),
  i: V('close', 'front', true, false),
  o: V('close-mid', 'back', true, true),
  u: V('close', 'back', true, true),
  p: C('stop', 'bilabial', false),
  b: C('stop', 'bilabial', true),
  t: C('stop', 'alveolar', false),
  d: C('stop', 'alveolar', true),
  k: C('stop', 'velar', false),
  ɡ: C('stop', 'velar', true),
  f: C('fricative', 'labiodental', false),
  s: C('fricative', 'alveolar', false),
  z: C('fricative', 'alveolar', true),
  ʃ: C('fricative', 'postalveolar', false),
  x: C('fricative', 'velar', false),
  m: C('nasal', 'bilabial', true),
  n: C('nasal', 'alveolar', true),
  ɲ: C('nasal', 'palatal', true),
  l: C('liquid', 'alveolar', true),
  ʎ: C('liquid', 'palatal', true),
  ɾ: C('liquid', 'alveolar', true),
  r: C('liquid', 'alveolar', true),
  j: C('approximant', 'palatal', true),
  ts: C('affricate', 'alveolar', false),
  tʃ: C('affricate', 'postalveolar', false),
};

/** Índice global de rasgos (inglés + euskera). */
export const PHONEME_FEATURES: Record<string, PhonemeFeatures> = {
  ...ENGLISH_VOWELS,
  ...ENGLISH_CONSONANTS,
  ...BASQUE_PHONEMES,
};

/** Devuelve los rasgos de un símbolo, o `undefined` si es desconocido. */
export function getFeatures(symbol: string): PhonemeFeatures | undefined {
  return PHONEME_FEATURES[symbol];
}

/**
 * Divide un texto en palabras (minúsculas), conservando apóstrofos y letras
 * acentuadas/vascas. Tokenizador único compartido por los fonemizadores de texto
 * y el scorer, para que los desplazamientos por palabra coincidan.
 */
export function tokenizeWords(text: string): string[] {
  return text.toLowerCase().split(/[^a-zàáéíóúüñ']+/).filter(Boolean);
}

export function isVowel(symbol: string): boolean {
  return getFeatures(symbol)?.category === 'vowel';
}

export function isConsonant(symbol: string): boolean {
  return getFeatures(symbol)?.category === 'consonant';
}

/**
 * Similitud de rasgos entre dos símbolos en [0, 1] (1 = idénticos).
 * Usada como coste de sustitución por defecto cuando el par no figura en el
 * catálogo de errores hispanohablantes.
 *
 * Heurística jerárquica:
 *  - símbolo idéntico → 1;
 *  - categoría distinta (vocal vs. consonante) → 0;
 *  - consonantes: misma manera vale 0.5, mismo punto +0.25, misma sonoridad +0.1;
 *  - vocales: misma altura vale 0.4, misma posterioridad +0.25, misma tensión +0.2,
 *    redondeo coincidente en posteriores +0.1.
 */
/** Símbolos conocidos ordenados por longitud descendente (para tokenización greedy). */
export const KNOWN_SYMBOLS: readonly string[] = Object.keys(PHONEME_FEATURES).sort(
  (a, b) => b.length - a.length,
);

/** Marca de acento primario en notación IPA de los diccionarios internos. */
const PRIMARY = '\u02c8';
/** Marca de acento secundario en notación IPA de los diccionarios internos. */
const SECONDARY = '\u02cc';

/**
 * Convierte una cadena IPA (con marcas opcionales de acento `ˈ`/`ˌ`) en una
 * secuencia `Phoneme[]`. Hace *matching greedy por longitud* para resolver los
 * símbolos multígrafo (`tʃ`, `iː`, `eɪ`, …) antes que los simples (`t`, `i`, …).
 * Los caracteres desconocidos se ignoran silenciosamente.
 */
export function tokenizeIPA(input: string): Phoneme[] {
  const out: Phoneme[] = [];
  let pendingStress: 0 | 1 | 2 = 0;
  let i = 0;
  while (i < input.length) {
    const ch = input[i];
    if (ch === PRIMARY) {
      pendingStress = 1;
      i += 1;
      continue;
    }
    if (ch === SECONDARY) {
      pendingStress = 2;
      i += 1;
      continue;
    }
    let matched: string | null = null;
    for (const sym of KNOWN_SYMBOLS) {
      if (input.startsWith(sym, i)) {
        matched = sym;
        break;
      }
    }
    if (matched === null) {
      i += 1;
      continue;
    }
    // El acento en IPA precede a la sílaba; debe recaer sobre la *vocal* de esa
    // sílaba, no sobre una consonante inicial.
    let stress: 0 | 1 | 2 = 0;
    if (pendingStress !== 0) {
      if (isVowel(matched)) {
        stress = pendingStress;
        pendingStress = 0;
      }
      // consonante antes de la vocal: se conserva el acento pendiente.
    }
    out.push({ symbol: matched, stress });
    i += matched.length;
  }
  return out;
}

export function featureSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  const fa = getFeatures(a);
  const fb = getFeatures(b);
  if (!fa || !fb) return 0;
  if (fa.category !== fb.category) return 0;

  if (fa.category === 'consonant' && fb.category === 'consonant') {
    let score = 0;
    if (fa.manner === fb.manner) score += 0.5;
    if (fa.place === fb.place) score += 0.25;
    if (fa.voice === fb.voice) score += 0.1;
    return Math.min(1, score);
  }

  // Vocales (ambas; la categoría ya se comprobó idéntica más arriba).
  const va = fa as VowelFeatures;
  const vb = fb as VowelFeatures;
  let score = 0;
  if (va.height === vb.height) score += 0.4;
  if (va.backness === vb.backness) score += 0.25;
  if (va.tensed === vb.tensed) score += 0.2;
  if (va.backness === 'back' && va.rounded === vb.rounded) score += 0.1;
  if (va.diphthong && !vb.diphthong) score -= 0.15;
  return Math.max(0, Math.min(1, score));
}