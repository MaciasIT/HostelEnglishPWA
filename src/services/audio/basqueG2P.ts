/**
 * Fonemizador de euskera (grafema → IPA) — FC-05.
 *
 * El euskera tiene una ortografía casi transparente, por lo que un mapeo
 * determinista grafema→fonema es suficiente (sin diccionario de excepciones más
 * allá de los dígrafos palatales). El acento léxico del euskera es distinto al
 * del inglés y no se modela aquí (todos los fonemas llevan `stress = 0`); el
 * scoring de euskera se apoya en la identidad de símbolo vía DTW, mientras que
 * el catálogo de errores hispanohablantes es específico del inglés.
 */

import { tokenizeWords, type Phoneme, type PhonemeSequence } from './phoneme';

type Mapping = Record<string, string>;

/** Mapa grafema → fonema IPA del euskera (ortografía transparente). */
const SINGLE: Mapping = {
  a: 'a', b: 'b', d: 'd', e: 'e', f: 'f', g: 'ɡ', h: '', i: 'i', j: 'j',
  k: 'k', l: 'l', m: 'm', n: 'n', o: 'o', p: 'p', r: 'ɾ', s: 's', t: 't',
  u: 'u', z: 'z', x: 'ʃ', ñ: 'ɲ',
};

const TRIGRAPH: Mapping = {
  ttx: 'tʃ',
};

const DIGRAPH: Mapping = {
  // Las oclusivas palatales ⟨dd⟩/⟨tt⟩ se simplifican a sus alveolares para
  // mantenerse dentro del inventario de rasgos compartido (el matiz palatal no
  // afecta al scoring por DTW práctica).
  dd: 'd', tt: 't', ts: 'ts', tz: 'ts', tx: 'tʃ', rr: 'r', ll: 'ʎ',
  in: 'ɲ', il: 'ʎ',
};

/** Fonemiza una única palabra vasca. Vacío si no contiene letras. */
export function basqueWordToPhonemes(rawWord: string): Phoneme[] {
  const w = rawWord.toLowerCase();
  if (!w || !/[a-zñ]/.test(w)) return [];

  const symbols: string[] = [];
  let i = 0;
  const n = w.length;

  while (i < n) {
    const c = w[i];

    // Trígrafos.
    const three = w.slice(i, i + 3);
    if (TRIGRAPH[three]) {
      symbols.push(TRIGRAPH[three]);
      i += 3;
      continue;
    }

    // Dígrafos (con prioridad a los palatales propios del euskera).
    const two = w.slice(i, i + 2);
    if (DIGRAPH[two]) {
      symbols.push(DIGRAPH[two]);
      i += 2;
      continue;
    }

    const mapped = SINGLE[c];
    if (mapped === undefined) {
      // Carácter no vasco (c/q/v/w/y de préstamos): aproximación fonética.
      if (c === 'v') symbols.push('b');
      else if (c === 'c' || c === 'q' || c === 'k') symbols.push('k');
      else if (c === 'w') symbols.push('u');
      else if (c === 'y') symbols.push('j');
      // el resto (h muda, etc.) se ignora.
    } else if (mapped !== '') {
      symbols.push(mapped);
    }
    i += 1;
  }

  return symbols.map((symbol) => ({ symbol, stress: 0 }));
}

/**
 * Fonemiza un texto vasco completo (concatena palabras, sin separadores).
 */
export function basqueTextToPhonemes(text: string): PhonemeSequence {
  const words = tokenizeWords(text);
  const out: Phoneme[] = [];
  for (const word of words) {
    out.push(...basqueWordToPhonemes(word.replace(/'/g, '')));
  }
  return out;
}