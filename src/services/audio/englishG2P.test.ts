import { describe, it, expect } from 'vitest';
import { englishTextToPhonemes, englishWordToPhonemes } from './englishG2P';

const symbols = (w: string): string[] => englishWordToPhonemes(w).map((p) => p.symbol);

describe('englishWordToPhonemes (diccionario)', () => {
  it('ship → /ʃɪp/', () => {
    expect(symbols('ship')).toEqual(['ʃ', 'ɪ', 'p']);
  });

  it('sheep → /ʃiːp/ (contraste tensa/laxa)', () => {
    expect(symbols('sheep')).toEqual(['ʃ', 'iː', 'p']);
  });

  it('think → /θɪŋk/ y sink → /sɪŋk/ (contraste θ/s)', () => {
    expect(symbols('think')).toEqual(['θ', 'ɪ', 'ŋ', 'k']);
    expect(symbols('sink')).toEqual(['s', 'ɪ', 'ŋ', 'k']);
  });

  it('normaliza la "r" del diccionario al aproximante /ɹ/', () => {
    expect(symbols('room')).toEqual(['ɹ', 'uː', 'm']);
  });

  it('asigna acento primario a la primera vocal cuando la entrada no lo marca', () => {
    const r = englishWordToPhonemes('ship');
    const vowel = r.find((p) => p.symbol === 'ɪ');
    expect(vowel?.stress).toBe(1);
    expect(r[0]?.stress).toBe(0);
  });
});

describe('englishWordToPhonemes (motor de reglas)', () => {
  it('cat → /kæt/ con acento en la vocal', () => {
    const r = englishWordToPhonemes('cat');
    expect(r.map((p) => p.symbol)).toEqual(['k', 'æ', 't']);
    expect(r[1]?.stress).toBe(1);
  });

  it('dog → /dɒɡ/', () => {
    expect(symbols('dog')).toEqual(['d', 'ɒ', 'ɡ']);
  });

  it('resuelve el dígrafo "sh"', () => {
    expect(symbols('shop')).toEqual(['ʃ', 'ɒ', 'p']);
  });
});

describe('englishTextToPhonemes (casos límite)', () => {
  it('concatena palabras y normaliza mayúsculas y puntuación', () => {
    expect(englishTextToPhonemes('Hello, SHIP!').map((p) => p.symbol)).toEqual([
      'h', 'ə', 'l', 'əʊ', 'ʃ', 'ɪ', 'p',
    ]);
  });

  it('devuelve vacío para entrada sin letras (números/puntuación)', () => {
    expect(englishTextToPhonemes('1234 !!')).toEqual([]);
  });

  it('devuelve vacío para cadena vacía', () => {
    expect(englishTextToPhonemes('')).toEqual([]);
  });
});