/**
 * Utilitario TTS híbrido — motor nativo de última instancia de la capa de audio.
 *
 * A partir de la Fase C, el euskera se reproduce con voces NATIVAS:
 *   - Piper (voz euskaldun on-device `eu_ES-antton-medium` / `eu_ES-maider-medium`,
 *     gestionada por el `PiperEngine` de `src/services/audio`), o
 *   - la Web Speech API con la etiqueta `eu-ES` cuando Piper no está disponible.
 *
 * Se eliminó el apaño fonético `euToEsPhonetic` (que leía el texto en euskera con
 * una voz castellana forzada) y la dependencia no oficial de Google Translate TTS.
 * La pronunciación del euskera ya es nativa, sin acento castellano forzado.
 */

export interface TTSSettings {
  rate: number;
  pitch: number;
  voiceURI?: string;
}

/** Mapeo idioma de la app → etiqueta BCP-47 de la voz nativa del sistema. */
const LANG_TO_VOICE: Record<'en' | 'eu' | 'es', string> = {
  en: 'en-US',
  eu: 'eu-ES',
  es: 'es-ES',
};

export const playAudio = async (
  text: string,
  lang: 'en' | 'eu' | 'es',
  settings: TTSSettings,
): Promise<void> => {
  window.speechSynthesis.cancel();

  const voiceLang = LANG_TO_VOICE[lang] ?? 'en-US';

  return new Promise<void>((resolve) => {
    const speak = () => {
      const voices = window.speechSynthesis.getVoices();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = voiceLang;
      utterance.rate = settings.rate;
      utterance.pitch = settings.pitch;

      if (settings.voiceURI) {
        const voice = voices.find((v) => v.voiceURI === settings.voiceURI);
        if (voice && voice.lang.toLowerCase().startsWith(lang)) {
          utterance.voice = voice;
        }
      } else if (lang === 'eu') {
        // Preferir una voz nativa en euskera si el sistema la expone; en caso
        // contrario se deja `lang = "eu-ES"` para que el navegador elija la
        // coincidencia más aproximada (sin forzar nunca una voz castellana).
        const euVoice = voices.find((v) => v.lang.toLowerCase().startsWith('eu'));
        if (euVoice) utterance.voice = euVoice;
      }

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      window.speechSynthesis.speak(utterance);
    };

    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = speak;
    } else {
      speak();
    }
  });
};