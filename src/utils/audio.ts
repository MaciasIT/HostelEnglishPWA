/**
 * Utilitario para manejar el Text-To-Speech (TTS) de forma híbrida.
 * Prioriza voces nativas del sistema, pero permite usar Google Translate TTS
 * como fallback de alta calidad para Euskera si se desea.
 */

export const playAudio = async (text: string, lang: 'en' | 'eu' | 'es', settings: { rate: number, pitch: number, voiceURI?: string }) => {
    window.speechSynthesis.cancel();

    const langMap: Record<string, string> = {
        'en': 'en-US',
        'eu': 'eu-ES',
        'es': 'es-ES'
    };

    const voiceLang = langMap[lang] || 'en-US';

    // Lógica de Google Translate TTS (Unofficial API)
    const useGoogleFallback = lang === 'eu';

    if (useGoogleFallback) {
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
            return;
        } catch (e) {
            console.warn("Google TTS Fallback failed, reverting to native speech", e);
        }
    }

    // MÉTODO NATIVO (Fallback)
    return new Promise<void>((resolve) => {
        // Phonetic mapping for Basque to sound acceptable on a Spanish TTS Voice
        const euToEsPhonetic = (texto: string) => {
            return texto
                .replace(/tx/gi, 'ch')
                .replace(/ts/gi, 's') 
                .replace(/tz/gi, 'ts')
                .replace(/x/gi, 'ch') 
                .replace(/j/gi, 'y')  // Jota vasca moderna
                .replace(/z/gi, 's')  // Evitar que lea la Z como C/Z de España (que se lea fricativa como S)
                .replace(/ge/gi, 'gue') // 'ge' en Euskera -> 'gue' en Castellano
                .replace(/gi/gi, 'gui')
                .replace(/ke/gi, 'que') 
                .replace(/ki/gi, 'qui');
        };

        const voices = window.speechSynthesis.getVoices();
        
        // Determinar qué idioma usar para la voz nativa
        let finalVoiceLang = voiceLang;
        let finalNativeText = text;

        // Si es Euskera, intentamos buscar si hay una voz de Euskera real instalada
        if (lang === 'eu') {
            const hasEuVoice = voices.some(v => v.lang.startsWith('eu'));
            if (!hasEuVoice) {
                // Si NO hay voz en Euskera instalada, engañamos al motor para que lea el Euskera 
                // con reglas fonéticas españolas usando una voz española (para que suene decente).
                finalNativeText = euToEsPhonetic(text);
                finalVoiceLang = 'es-ES'; // Forzamos voz española para el apaño fonético
            }
        }

        const utterance = new SpeechSynthesisUtterance(finalNativeText);
        utterance.lang = finalVoiceLang;
        utterance.rate = settings.rate;
        utterance.pitch = settings.pitch;

        if (settings.voiceURI) {
            const voice = voices.find(v => v.voiceURI === settings.voiceURI);
            // Basic check: if the selected voice language strictly matches or is a prefix
            if (voice && (voice.lang.startsWith(lang) || (lang === 'en' && voice.lang.startsWith('en')))) {
                utterance.voice = voice;
            }
        }

        utterance.onend = () => resolve();
        utterance.onerror = () => resolve();

        window.speechSynthesis.speak(utterance);
    });
};
