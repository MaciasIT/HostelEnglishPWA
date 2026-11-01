import { describe, it, expect } from 'vitest';

import {
  PIPER_VOICES,
  SUPPORTED_PIPER_LANGUAGES,
  hasPiperVoice,
  piperModelUrl,
  piperVoicesFor,
  resolvePiperVoice,
} from './piperVoices';

describe('piperVoices — registro de voces euskaldunas (FC-09)', () => {
  it('registra las dos voces euskaldunas: Antton (male) y Maider (female)', () => {
    expect(Object.keys(PIPER_VOICES)).toHaveLength(2);
    expect(PIPER_VOICES['eu_ES-antton-medium']).toMatchObject({
      language: 'eu',
      gender: 'male',
      name: 'Antton',
      espeakVoice: 'eu',
      sampleRate: 22050,
    });
    expect(PIPER_VOICES['eu_ES-maider-medium']).toMatchObject({
      language: 'eu',
      gender: 'female',
      name: 'Maider',
      espeakVoice: 'eu',
    });
  });

  it('solo da servicio nativo al euskera', () => {
    expect(SUPPORTED_PIPER_LANGUAGES).toEqual(['eu']);
    expect(hasPiperVoice('eu')).toBe(true);
    expect(hasPiperVoice('en')).toBe(false);
    expect(hasPiperVoice('es')).toBe(false);
  });

  it('resuelve la voz por defecto de euskera (Antton)', () => {
    expect(resolvePiperVoice('eu')?.id).toBe('eu_ES-antton-medium');
  });

  it('respeta el alias corto y el id completo', () => {
    expect(resolvePiperVoice('eu', 'maider')?.id).toBe('eu_ES-maider-medium');
    expect(resolvePiperVoice('eu', 'eu_ES-maider-medium')?.id).toBe('eu_ES-maider-medium');
  });

  it('devuelve undefined para idiomas sin voz Piper', () => {
    expect(resolvePiperVoice('en')).toBeUndefined();
    expect(resolvePiperVoice('es')).toBeUndefined();
  });

  it('lista las voces de un idioma para la UI de selección', () => {
    expect(piperVoicesFor('eu')).toHaveLength(2);
    expect(piperVoicesFor('en')).toHaveLength(0);
  });

  it('construye la URL del modelo desde el base URL', () => {
    const url = piperModelUrl(PIPER_VOICES['eu_ES-antton-medium']);
    expect(url).toContain('eu/eu_ES/antton/medium/eu_ES-antton-medium.onnx');
  });
});