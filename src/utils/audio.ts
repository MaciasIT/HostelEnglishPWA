/**
 * Utilitario para manejar el Text-To-Speech (TTS) de forma híbrida.
 * Prioriza voces nativas del sistema, pero permite usar Google Translate TTS
 * como fallback de alta calidad para Euskera si se desea.
 */

export const playAudio = async (text: string, lang: 'en' | 'eu', settings: { rate: number, pitch: number, voiceURI?: string }) => {
    window.speechSynthesis.cancel();

    // Si es Euskera y queremos la máxima calidad (o no hay voces nativas), 
    // podríamos usar un servicio externo. Por ahora, implementamos una lógica
    // que facilita el cambio a Google TTS si el usuario lo prefiere.

    const voiceLang = lang === 'eu' ? 'eu-ES' : 'en-US';

    // Lógica de Google Translate TTS (Unofficial API)
    // Nota: Algunos navegadores pueden bloquear esto por CORS si se usa directamente desde el cliente.
    // Pero para muchas PWAs funciona como fallback dinámico.
    const useGoogleFallback = lang === 'eu';

    if (useGoogleFallback) {
        // Intentamos cargar el audio de Google Translate TTS
        // El límite suele ser de 200 caracteres por petición
        const chunks = text.match(/.{1,200}(\s|$)/g) || [text];

        try {
            for (const chunk of chunks) {
                const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(chunk)}&tl=${lang}&client=tw-ob`;
                const audio = new Audio(url);
                audio.playbackRate = settings.rate;
                await new Promise((resolve, reject) => {
                    audio.onended = resolve;
                    audio.onerror = reject;
                    audio.play().catch(reject);
                });
            }
            return; // Si funcionó, salimos
        } catch (e) {
            console.warn("Google TTS Fallback failed, reverting to native speech", e);
            // Si falla (por red o CORS), continuamos con el método nativo abajo
        }
    }

    // MÉTODO NATIVO (Fallback)
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = voiceLang;
    utterance.rate = settings.rate;
    utterance.pitch = settings.pitch;

    if (settings.voiceURI) {
        const voice = window.speechSynthesis.getVoices().find(v => v.voiceURI === settings.voiceURI);
        if (voice && voice.lang.startsWith(lang)) {
            utterance.voice = voice;
        }
    }

    window.speechSynthesis.speak(utterance);
};
