/**
 * Fachada del fonemizador (FC-05).
 *
 * Un punto de entrada único para convertir texto (grafemas) en secuencias
 * fonéticas (`Phoneme[]`) en inglés o euskera, ocultando al resto de la capa de
 * audio qué G2P concreto se emplea. Ambos G2P son deterministas y puros.
 */

import type { PhonemeSequence } from './phoneme';
import { englishTextToPhonemes } from './englishG2P';
import { basqueTextToPhonemes } from './basqueG2P';

/** Idiomas soportados por el scoring fonético. */
export type ScoringLanguage = 'en' | 'eu';

/**
 * Normaliza y fonemiza un texto. Vacío para entradas sin letras.
 *
 * @param text   Texto a fonemizar (frase objetivo o transcripción ASR).
 * @param language 'en' (inglés) o 'eu' (euskera).
 */
export function phonemize(text: string, language: ScoringLanguage): PhonemeSequence {
  switch (language) {
    case 'en':
      return englishTextToPhonemes(text);
    case 'eu':
      return basqueTextToPhonemes(text);
  }
}