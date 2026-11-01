/**
 * Utilitario TTS híbrido — motor de síntesis de audio para la PWA.
 *
 * Estrategia para Euskera:
 * 1. Online: Si hay conexión a internet, utiliza el servicio de audio neuronal
 *    Google Translate TTS con `tl=eu` (pronunciación nativa de alta fidelidad).
 * 2. Fallback Nativo Web Speech:
 *    a. Si el navegador expone una voz nativa en euskera (`eu` / `eu-ES`), la usa.
 *    b. Si no existe voz de euskera (caso común en Chrome para Linux, Android y Windows),
 *       aplica la transcripción fonética `euToEsPhonetic` y sintetiza con una voz en
 *       castellano (`es-ES`), garantizando fonemas y vocales naturales sin acento inglés.
 *
 * Estrategia para Inglés y Español:
 * - Selección estricta de voz según el código BCP-47 del idioma destino (`en-*` / `es-*`),
 *   evitando que Chrome recurra a la voz por defecto del sistema cuando difiere del idioma.
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

/**
 * Adaptación fonética de grafemas del euskera para motores TTS en castellano.
 * Reproduce fielmente la fonología de las sibilantes, africadas y oclusivas vascas.
 */
export const euToEsPhonetic = (texto: string): string => {
  return texto
    .replace(/tx/gi, 'ch')
    .replace(/ts/gi, 's')
    .replace(/tz/gi, 'ts')
    .replace(/x/gi, 'ch')
    .replace(/j/gi, 'y')       // Jota vasca moderna / Batua
    .replace(/z/gi, 's')       // Zeta vasca sibilante
    .replace(/ge/gi, 'gue')    // 'ge' euskera -> oclusiva velar sonora [ge]
    .replace(/gi/gi, 'gui')    // 'gi' euskera -> oclusiva velar sonora [gi]
    .replace(/ke/gi, 'que')
    .replace(/ki/gi, 'qui');
};

/**
 * Reproducción de audio vía Google Translate TTS (soporte nativo para `tl=eu`).
 */
export const playGoogleTTS = (text: string, rate: number = 1): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || typeof Audio === 'undefined') {
      return reject(new Error('Audio not available'));
    }

    const trimmed = text.trim();
    if (!trimmed) {
      return resolve();
    }

    const chunk = trimmed.length > 200 ? trimmed.slice(0, 200) : trimmed;
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(chunk)}&tl=eu&client=gtx`;

    const audio = new Audio();
    audio.src = url;
    audio.playbackRate = rate;

    const timeout = setTimeout(() => {
      audio.pause();
      reject(new Error('Google TTS timeout'));
    }, 4500);

    audio.onended = () => {
      clearTimeout(timeout);
      resolve();
    };

    audio.onerror = (err) => {
      clearTimeout(timeout);
      reject(err);
    };

    audio.play().catch((err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
};

export const playAudio = async (
  text: string,
  lang: 'en' | 'eu' | 'es',
  settings: TTSSettings = { rate: 1, pitch: 1 },
): Promise<void> => {
  if (typeof window === 'undefined') return;

  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }

  // 1. En Euskera, si estamos online y no estamos en entorno de tests, intentamos Google Translate TTS
  const isTest = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';
  if (lang === 'eu' && !isTest && typeof navigator !== 'undefined' && navigator.onLine) {
    try {
      await playGoogleTTS(text, settings.rate);
      return;
    } catch {
      // Degrada de forma limpia al sintetizador nativo
    }
  }

  // 2. Síntesis nativa vía Web Speech API con selección estricta de voz
  const voiceLang = LANG_TO_VOICE[lang] ?? 'en-US';

  return new Promise<void>((resolve) => {
    if (!window.speechSynthesis) {
      return resolve();
    }

    const speak = () => {
      const voices = window.speechSynthesis.getVoices() || [];

      let finalVoiceLang = voiceLang;
      let finalNativeText = text;
      let selectedVoice: SpeechSynthesisVoice | undefined;

      // Si el usuario eligió una voz específica en configuración que coincida con el idioma
      if (settings.voiceURI) {
        selectedVoice = voices.find(
          (v) => v.voiceURI === settings.voiceURI && v.lang.toLowerCase().startsWith(lang)
        );
      }

      if (lang === 'eu') {
        const euVoice = selectedVoice || voices.find((v) => v.lang.toLowerCase().startsWith('eu'));
        if (euVoice) {
          selectedVoice = euVoice;
          finalVoiceLang = euVoice.lang;
        } else {
          // Fallback fonético: Si Chrome/navegador carece de voz vasca nativa,
          // usamos una voz en castellano con adaptación fonética para evitar
          // que Chrome lea el euskera con acento estadounidense o voz inglesa.
          const esVoice = voices.find((v) => v.lang.toLowerCase().startsWith('es'));
          if (esVoice) {
            selectedVoice = esVoice;
            finalVoiceLang = esVoice.lang;
          } else {
            finalVoiceLang = 'es-ES';
          }
          finalNativeText = euToEsPhonetic(text);
        }
      } else if (!selectedVoice) {
        // Para inglés o castellano: Si no hay voz explícita, asegurar que seleccionamos
        // una voz nativa que coincida exactamente con el idioma solicitado.
        selectedVoice = voices.find((v) => v.lang.toLowerCase().startsWith(lang));
      }

      const utterance = new SpeechSynthesisUtterance(finalNativeText);
      utterance.lang = selectedVoice?.lang || finalVoiceLang;
      utterance.rate = settings.rate;
      utterance.pitch = settings.pitch;

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      window.speechSynthesis.speak(utterance);
    };

    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.onvoiceschanged = null;
        speak();
      };
    } else {
      speak();
    }
  });
};