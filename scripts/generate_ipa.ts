/**
 * FD-02 — Backfill de IPA de frases heredadas.
 *
 * Genera el campo `ipa` para TODAS las frases que aún no lo tengan, usando el
 * G2P real de la app (`englishG2P`) para no duplicar lógica ni introducir
 * derivas. El resultado es determinista y reproducible: ejecutar de nuevo este
 * script produce el mismo `ipa`.
 *
 * Uso (con jiti, ya en node_modules/.bin):
 *     node_modules/.bin/jiti scripts/generate_ipa.ts
 *
 * Formato emitido: símbolos IPA con acento léxico (`ˈ` primario, `ˌ`
 * secundario), palabras separadas por un espacio, sin barras. Coherente con lo
 * que `tokenizeIPA` es capaz de volver a leer.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { englishWordToPhonemes } from '../src/services/audio/englishG2P';
import { tokenizeWords } from '../src/services/audio/phoneme';

const __dirname = dirname(fileURLToPath(import.meta.url));

const STRESS: Record<number, string> = { 0: '', 1: 'ˈ', 2: 'ˌ' };

function ipaFor(text: string): string {
  return tokenizeWords(text)
    .map((w) =>
      englishWordToPhonemes(w)
        .map((p) => STRESS[p.stress] + p.symbol)
        .join(''),
    )
    .join(' ')
    .trim();
}

const DATA = resolve(__dirname, '..', 'public', 'data');
const PHRASES_PATH = resolve(DATA, 'hostelenglish_dataset_clean.json');

const data = JSON.parse(readFileSync(PHRASES_PATH, 'utf8')) as {
  phrases: Array<Record<string, unknown>>;
};

let filled = 0;
let skipped = 0;
for (const phrase of data.phrases) {
  const en = String(phrase.en ?? '');
  if (phrase.ipa && String(phrase.ipa).trim() !== '') {
    skipped += 1;
    continue;
  }
  phrase.ipa = ipaFor(en);
  filled += 1;
}

writeFileSync(PHRASES_PATH, JSON.stringify(data, null, 2) + '\n', 'utf8');
console.log(
  `[ipa] backfill completado: ${filled} generadas, ${skipped} ya presentes (total ${data.phrases.length}).`,
);