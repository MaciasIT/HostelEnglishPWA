import { describe, it, expect, vi, beforeEach } from 'vitest';
import { playAudio, euToEsPhonetic } from './audio';

describe('audio utils', () => {
  describe('euToEsPhonetic', () => {
    it('adapta correctamente los dígrafos y sibilantes del euskera al español', () => {
      expect(euToEsPhonetic('txakolina')).toBe('chakolina');
      expect(euToEsPhonetic('etxea')).toBe('echea');
      expect(euToEsPhonetic('zaindari')).toBe('saindari');
      expect(euToEsPhonetic('mesedez')).toBe('mesedes');
      expect(euToEsPhonetic('gero arte')).toBe('guero arte');
      expect(euToEsPhonetic('giltza')).toBe('guiltsa');
      expect(euToEsPhonetic('jakin')).toBe('yaquin');
      expect(euToEsPhonetic('Kaixo')).toBe('Kaicho');
      expect(euToEsPhonetic('Kaixo, zer moduz?')).toBe('Kaicho, ser modus?');
    });
  });

  describe('playAudio', () => {
    let mockVoices: any[];
    let speakMock: any;

    beforeEach(() => {
      mockVoices = [
        { name: 'Google US English', lang: 'en-US', voiceURI: 'google-en' },
        { name: 'Google Español', lang: 'es-ES', voiceURI: 'google-es' },
      ];

      speakMock = vi.fn((utterance: any) => {
        // Simular que el navegador finaliza la locución de forma asíncrona
        setTimeout(() => {
          if (utterance.onend) utterance.onend();
        }, 5);
      });

      (window as any).speechSynthesis = {
        cancel: vi.fn(),
        speak: speakMock,
        getVoices: vi.fn(() => mockVoices),
        onvoiceschanged: null,
      };
    });

    it('selecciona voz en inglés estrictamente cuando lang === "en"', async () => {
      await playAudio('Hello friend', 'en', { rate: 1, pitch: 1 });

      expect(speakMock).toHaveBeenCalledTimes(1);
      const utterance = speakMock.mock.calls[0][0];
      expect(utterance.text).toBe('Hello friend');
      expect(utterance.voice?.lang).toBe('en-US');
    });

    it('selecciona voz en español estrictamente cuando lang === "es"', async () => {
      await playAudio('Hola amigo', 'es', { rate: 1, pitch: 1 });

      expect(speakMock).toHaveBeenCalledTimes(1);
      const utterance = speakMock.mock.calls[0][0];
      expect(utterance.text).toBe('Hola amigo');
      expect(utterance.voice?.lang).toBe('es-ES');
    });

    it('aplica fallback fonético con voz en español cuando no hay voz de euskera nativa', async () => {
      await playAudio('Kaixo, zer moduz?', 'eu', { rate: 1, pitch: 1 });

      expect(speakMock).toHaveBeenCalledTimes(1);
      const utterance = speakMock.mock.calls[0][0];
      expect(utterance.text).toBe('Kaicho, ser modus?');
      expect(utterance.voice?.lang).toBe('es-ES');
    });

    it('utiliza la voz nativa de euskera si el sistema dispone de ella', async () => {
      mockVoices.push({ name: 'Ainhoa Basque', lang: 'eu-ES', voiceURI: 'basque-voice' });

      await playAudio('Kaixo, zer moduz?', 'eu', { rate: 1, pitch: 1 });

      expect(speakMock).toHaveBeenCalledTimes(1);
      const utterance = speakMock.mock.calls[0][0];
      expect(utterance.text).toBe('Kaixo, zer moduz?');
      expect(utterance.voice?.voiceURI).toBe('basque-voice');
    });
  });
});
