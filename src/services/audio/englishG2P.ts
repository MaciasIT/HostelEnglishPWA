/**
 * Fonemizador ligero de inglés (grafema → IPA) — FC-05.
 *
 * Decisión de arquitectura (documentada): en vez de `espeak-ng` nativo (binding
 * Node.js que rompería el build de navegador y añadiría un binario WASM grande),
 * se usa un G2P determinista en TypeScript puro: **diccionario de excepciones +
 * reglas de reescritura**. Es ligero, offline, determinista y suficiente para el
 * dominio hotelero (B1–B2) y para los pares de contraste del catálogo de errores
 * (ship/sheep, very/berry, think/sink, …). El diccionario cubre las irregularidades
 * que las reglas no resuelven; las reglas resuelven el resto de forma aproximada.
 *
 * La salida es una secuencia `Phoneme[]` con acento léxico primario (1) sobre la
 * primera vocal tónica de cada palabra — señal usada por la métrica Prosody.
 */

import { isVowel, tokenizeIPA, tokenizeWords, type Phoneme, type PhonemeSequence } from './phoneme';

/* ------------------------------------------------------------------ */
/* Diccionario de excepciones (irregularidades + dominio hotelero)       */
/* ------------------------------------------------------------------ */

/** Entradas IPA; `ˈ` = acento primario. Ante cons., "the" es /ðə/. */
const DICTIONARY: Record<string, string> = {
  // Palabras funcionales (con sonorización de /ð/ en demostrativos).
  a: 'ə',
  an: 'ən',
  the: 'ðə',
  i: 'aɪ',
  you: 'juː',
  your: 'jɔː',
  he: 'hiː',
  she: 'ʃiː',
  we: 'wiː',
  they: 'ðeɪ',
  them: 'ðem',
  their: 'ðeə',
  this: 'ðɪs',
  that: 'ðæt',
  these: 'ðiːz',
  those: 'ðəʊz',
  there: 'ðeə',
  is: 'ɪz',
  are: 'ɑː',
  was: 'wɒz',
  were: 'wɜː',
  to: 'tə',
  for: 'fɔː',
  of: 'əv',
  and: 'ənd',
  my: 'maɪ',
  mine: 'maɪn',
  do: 'duː',
  does: 'dʌz',
  have: 'hæv',
  has: 'hæz',
  with: 'wɪð',
  one: 'wʌn',
  two: 'tuː',
  three: 'θriː',
  four: 'fɔː',
  five: 'faɪv',
  six: 'sɪks',
  seven: 'ˈsevn',
  eight: 'eɪt',
  nine: 'naɪn',
  ten: 'ten',
  // Cortesía y servicio hotelero.
  hello: 'həˈləʊ',
  hi: 'haɪ',
  please: 'pliːz',
  thank: 'θæŋk',
  thanks: 'θæŋks',
  sorry: 'ˈsɒri',
  welcome: 'ˈwelkəm',
  help: 'help',
  check: 'tʃek',
  checkout: 'ˈtʃekaʊt',
  checkin: 'ˈtʃekɪn',
  reservation: 'ˌrezəˈveɪʃən',
  reception: 'rɪˈsepʃən',
  room: 'ruːm',
  key: 'kiː',
  card: 'kɑːd',
  bill: 'bɪl',
  menu: 'ˈmenjuː',
  breakfast: 'ˈbrekfəst',
  lunch: 'lʌntʃ',
  dinner: 'ˈdɪnə',
  water: 'ˈwɔːtə',
  passport: 'ˈpɑːspɔːt',
  customer: 'ˈkʌstəmə',
  guest: 'ɡest',
  luggage: 'ˈlʌɡɪdʒ',
  baggage: 'ˈbæɡɪdʒ',
  hotel: 'həʊˈtel',
  night: 'naɪt',
  morning: 'ˈmɔːnɪŋ',
  evening: 'ˈiːvnɪŋ',
  today: 'təˈdeɪ',
  tomorrow: 'təˈmɒrəʊ',
  yes: 'jes',
  no: 'nəʊ',
  where: 'weə',
  what: 'wɒt',
  when: 'wen',
  who: 'huː',
  how: 'haʊ',
  can: 'kæn',
  could: 'kʊd',
  should: 'ʃʊd',
  want: 'wɒnt',
  need: 'niːd',
  like: 'laɪk',
  out: 'aʊt',
  about: 'əˈbaʊt',
  good: 'ɡʊd',
  food: 'fuːd',
  book: 'bʊk',
  look: 'lʊk',
  // Pares de contraste del catálogo de errores hispanohablantes.
  ship: 'ʃɪp',
  sheep: 'ʃiːp',
  very: 'ˈveri',
  berry: 'ˈberi',
  think: 'θɪŋk',
  sink: 'sɪŋk',
  sin: 'sɪn',
  thin: 'θɪn',
  tree: 'triː',
  bath: 'bɑːθ',
  bathe: 'beɪð',
  board: 'bɔːd',
  bored: 'bɔːd',
  // Irregularidades frecuentes mal resueltas por reglas.
  people: 'ˈpiːpl',
  friend: 'frend',
  work: 'wɜːk',
  word: 'wɜːd',
  world: 'wɜːld',
  would: 'wʊd',
  blood: 'blʌd',
  heart: 'hɑːt',
  head: 'hed',
  bread: 'bred',
  ready: 'ˈredi',
  meant: 'ment',
  great: 'ɡreɪt',
  break: 'breɪk',
  steak: 'steɪk',
  weather: 'ˈweðə',
  again: 'əˈɡen',
  said: 'sed',
  says: 'sez',
  been: 'biːn',
  busy: 'ˈbɪzi',
  business: 'ˈbɪznəs',
  minute: 'ˈmɪnɪt',
  hour: 'ˈaʊə',
  our: 'ˈaʊə',
  // Contracciones.
  "i'm": 'aɪm',
  "you're": 'jɔː',
  "it's": 'ɪts',
};

/* ------------------------------------------------------------------ */
/* Motores G2P                                                         */
/* ------------------------------------------------------------------ */

const VOWEL_LETTERS = new Set(['a', 'e', 'i', 'o', 'u', 'y']);

const SHORT_VOWEL: Record<string, string> = {
  a: 'æ', e: 'e', i: 'ɪ', o: 'ɒ', u: 'ʌ', y: 'ɪ',
};
const LONG_VOWEL: Record<string, string> = {
  a: 'eɪ', e: 'iː', i: 'aɪ', o: 'əʊ', u: 'juː', y: 'aɪ',
};

/** ¿La palabra termina en "e" muda (vocal + 1 consonante + e)? */
function hasSilentE(word: string): boolean {
  return /(?:[aeiouy][b-df-hj-np-tv-z])e$/i.test(word);
}

/**
 * Fonemiza una única palabra inglesa (minúsculas, sin puntuación). Vacío si no
 * contiene letras.
 */
export function englishWordToPhonemes(rawWord: string): Phoneme[] {
  const w = rawWord.toLowerCase().replace(/['’]/g, '');
  if (!w || !/[a-z]/.test(w)) return [];
  const entry = DICTIONARY[rawWord.toLowerCase()] ?? DICTIONARY[w];
  const phonemes = entry
    ? // La 'r' de las entradas IPA denota el aproximante alveolar inglés /ɹ/
      // (no la vibrante del euskera); se normaliza al símbolo canónico.
      tokenizeIPA(entry).map((p) => (p.symbol === 'r' ? { symbol: 'ɹ', stress: p.stress } : p))
    : ruleBased(w);

  // Normalización: si la entrada no marca acento explícito, la primera vocal
  // recibe acento primario (coherente con el motor de reglas) para que la
  // comparación prosódica objetivo↔oída sea simétrica.
  if (!phonemes.some((p) => p.stress !== 0)) {
    const firstVowel = phonemes.find((p) => isVowel(p.symbol));
    if (firstVowel) firstVowel.stress = 1;
  }
  return phonemes;
}

function ruleBased(word: string): Phoneme[] {
  const silentE = hasSilentE(word);
  const s = silentE ? word.slice(0, -1) : word;
  const symbols: string[] = [];
  let i = 0;
  const n = s.length;

  while (i < n) {
    const c = s[i];
    const next = s[i + 1] ?? '';

    // "y" inicial seguida de vocal es consonante /j/.
    const isConsonantY = c === 'y' && i === 0 && VOWEL_LETTERS.has(next);

    if (VOWEL_LETTERS.has(c) && !isConsonantY) {
      const [sym, len] = vowelSound(s, i, n, silentE);
      symbols.push(sym);
      i += len;
      continue;
    }

    i = consonantSound(symbols, s, i, n);
  }

  // Acento primario sobre la primera vocal tónica.
  const result: Phoneme[] = [];
  let placed = false;
  for (const sym of symbols) {
    const isV = isVowel(sym);
    result.push({ symbol: sym, stress: !placed && isV ? 1 : 0 });
    if (isV) placed = true;
  }
  return result;
}

/**
 * Resuelve una vocal (o equipo vocálico) empezando en `pos`. Devuelve el símbolo
 * y los caracteres consumidos.
 */
function vowelSound(s: string, pos: number, totalLen: number, silentE: boolean): [string, number] {
  const at = (k: number): string => s[pos + k] ?? '';
  const slice = (k: number): string => s.slice(pos, pos + k).toLowerCase();
  const c = s[pos].toLowerCase();

  const three = slice(3);
  const two = slice(2);

  // Equipos con 'r'/centrados.
  if (three === 'air' || three === 'are') return ['eə', 3];
  if (three === 'ear') return ['ɪə', 3];
  if (three === 'eer' || three === 'ere') return ['ɪə', 3];
  if (three === 'igh') return ['aɪ', 3];
  if (three === 'eig') return ['eɪ', 3];

  // Diptongos largos / equipos vocálicos.
  if (two === 'ee') return ['iː', 2];
  if (two === 'ea') return ['iː', 2];
  if (two === 'oo') return ['uː', 2];
  if (two === 'ou') return ['aʊ', 2];
  if (two === 'ow') return ['əʊ', 2];
  if (two === 'oi' || two === 'oy') return ['ɔɪ', 2];
  if (two === 'oa' || two === 'oe') return ['əʊ', 2];
  if (two === 'au' || two === 'aw') return ['ɔː', 2];
  if (two === 'ew' || two === 'eu') return ['juː', 2];
  if (two === 'ey') return ['eɪ', 2];
  if (two === 'ay') return ['eɪ', 2];
  if (two === 'ai') return ['eɪ', 2];
  if (two === 'ie') return ['iː', 2];
  if (two === 'ue' || two === 'ui') return ['uː', 2];

  // Vocal + 'r' (no cubierta por los equipos anteriores).
  if (at(1) === 'r') {
    if (c === 'a') return ['ɑː', 2];
    if (c === 'o') return ['ɔː', 2];
    return ['ɜː', 2];
  }

  // "y" final: /iː/ en polisílabas (aproximación), /aɪ/ en monosílabas.
  if (c === 'y' && at(1) === '') {
    return [totalLen > 3 ? 'iː' : 'aɪ', 1];
  }

  // "magic e": vocal larga cuando queda una única consonante antes del final.
  if (silentE && pos === totalLen - 2) {
    return [LONG_VOWEL[c] ?? 'ʌ', 1];
  }

  return [SHORT_VOWEL[c] ?? 'ʌ', 1];
}

/** Consonantes y dígrafos: empuja a `symbols` y devuelve la nueva posición. */
function consonantSound(symbols: string[], s: string, pos: number, _n: number): number {
  const c = s[pos];
  const next = s[pos + 1] ?? '';
  const two = (c + next).toLowerCase();

  // Trígrafos.
  if (s.slice(pos, pos + 3).toLowerCase() === 'tch') {
    symbols.push('tʃ');
    return pos + 3;
  }

  // Dígrafos.
  if (two === 'ck') { symbols.push('k'); return pos + 2; }
  if (two === 'ch') { symbols.push('tʃ'); return pos + 2; }
  if (two === 'sh') { symbols.push('ʃ'); return pos + 2; }
  if (two === 'th') { symbols.push('θ'); return pos + 2; }
  if (two === 'ph') { symbols.push('f'); return pos + 2; }
  if (two === 'wh') { symbols.push('w'); return pos + 2; }
  if (two === 'wr') { symbols.push('ɹ'); return pos + 2; }
  if (two === 'kn' && pos === 0) { symbols.push('n'); return pos + 2; }
  if (two === 'ng') { symbols.push('ŋ'); return pos + 2; }
  if (two === 'qu') { symbols.push('k', 'w'); return pos + 2; }
  if (two === 'ge' || two === 'gi' || two === 'gy') { symbols.push('dʒ'); return pos + 1; }
  if (two === 'ce' || two === 'ci' || two === 'cy') { symbols.push('s'); return pos + 1; }
  if (two === 'dge') { symbols.push('dʒ'); return pos + 2; }

  switch (c.toLowerCase()) {
    case 'b': symbols.push('b'); break;
    case 'c':
      symbols.push(next === 'e' || next === 'i' || next === 'y' ? 's' : 'k');
      break;
    case 'd': symbols.push('d'); break;
    case 'f': symbols.push('f'); break;
    case 'g':
      symbols.push(next === 'e' || next === 'i' || next === 'y' ? 'dʒ' : 'ɡ');
      break;
    case 'h': symbols.push('h'); break;
    case 'j': symbols.push('dʒ'); break;
    case 'k': symbols.push('k'); break;
    case 'l': symbols.push('l'); break;
    case 'm': symbols.push('m'); break;
    case 'n': symbols.push('n'); break;
    case 'p': symbols.push('p'); break;
    case 'q': symbols.push('k'); break;
    case 'r': symbols.push('ɹ'); break;
    case 's': symbols.push('s'); break;
    case 't': symbols.push('t'); break;
    case 'v': symbols.push('v'); break;
    case 'w': symbols.push('w'); break;
    case 'x': symbols.push('k', 's'); break;
    case 'y': symbols.push('j'); break;
    case 'z': symbols.push('z'); break;
    default:
      // Carácter no reconocido (dígito/símbolo): no emite nada.
      break;
  }
  return pos + 1;
}

/**
 * Fonemiza un texto completo: normaliza y concatena los fonemas palabra a
 * palabra (sin separadores entre palabras).
 */
export function englishTextToPhonemes(text: string): PhonemeSequence {
  const tokens = tokenizeWords(text);
  const out: Phoneme[] = [];
  for (const token of tokens) {
    out.push(...englishWordToPhonemes(token));
  }
  return out;
}