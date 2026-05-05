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

    // Phonetic mapping for Basque to sound acceptable on a Spanish TTS Voice
    const euToEsPhonetic = (texto: string) => {
        return texto
            .replace(/tx/gi, 'ch')
            .replace(/ts/gi, 's') 
            .replace(/tz/gi, 'ts')
            .replace(/x/gi, 'ch') 
            .replace(/j/gi, 'y')  // Jota vasca moderna
            .replace(/z/gi, 's')  // Zeta vasca -> S fricativa
            .replace(/ge/gi, 'gue') // 'ge' en Euskera -> 'gue' en Castellano
            .replace(/gi/gi, 'gui')
            .replace(/ke/gi, 'que') 
            .replace(/ki/gi, 'qui');
    };

    // Aplicar el parche fonético si es euskera (afecta tanto a Google como al Nativo)
    const processedText = lang === 'eu' ? euToEsPhonetic(text) : text;

    // Lógica de Google Translate TTS (Unofficial API)
    const useGoogleFallback = lang === 'eu';

    if (useGoogleFallback) {
        const chunks = processedText.match(/.{1,200}(\s|$)/g) || [processedText];

        try {
            for (const chunk of chunks) {
                const tlParam = 'es'; 
                const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(chunk)}&tl=${tlParam}&client=tw-ob`;
                
                const audio = new Audio();
                audio.src = url;
                audio.playbackRate = settings.rate;
                audio.crossOrigin = "anonymous"; // Intentar evitar problemas de CORS si el servidor lo permite

                await new Promise((resolve, reject) => {
                    audio.onended = resolve;
                    audio.onerror = (err) => {
                        console.error("Audio error on chunk:", chunk, err);
                        reject(err);
                    };
                    
                    // Pequeño timeout para no saturar si hay muchos chunks
                    const playPromise = audio.play();
                    if (playPromise !== undefined) {
                        playPromise.catch(error => {
                            console.error("Playback failed:", error);
                            reject(error);
                        });
                    }
                });
            }
            return;
        } catch (e) {
            console.warn("Google TTS Fallback failed, reverting to native speech", e);
            // Si falla Google, el flujo continuará al método nativo de abajo
        }
    }

    // MÉTODO NATIVO (Fallback)
    return new Promise<void>((resolve) => {
        // Asegurarse de que las voces estén cargadas
        let voices = window.speechSynthesis.getVoices();
        
        // Determinar qué idioma usar para la voz nativa
        let finalVoiceLang = voiceLang;
        let finalNativeText = text;

        if (lang === 'eu') {
            const hasEuVoice = voices.some(v => v.lang.startsWith('eu'));
            if (!hasEuVoice) {
                finalNativeText = processedText;
                finalVoiceLang = 'es-ES'; 
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
