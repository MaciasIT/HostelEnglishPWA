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
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = voiceLang;
        utterance.rate = settings.rate;
        utterance.pitch = settings.pitch;

        if (settings.voiceURI) {
            const voice = window.speechSynthesis.getVoices().find(v => v.voiceURI === settings.voiceURI);
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
