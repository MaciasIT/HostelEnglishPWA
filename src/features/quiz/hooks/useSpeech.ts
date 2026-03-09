import { useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';

export const useSpeech = () => {
    const { prefs } = useAppStore();
    const { phraseSettings, targetLanguage } = prefs;

    const speak = useCallback((text: string) => {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = targetLanguage === 'eu' ? 'eu-ES' : 'en-US';
        utterance.rate = phraseSettings.rate;
        utterance.pitch = phraseSettings.pitch;

        if (phraseSettings.voiceURI) {
            const voices = window.speechSynthesis.getVoices();
            const voice = voices.find(v => v.voiceURI === phraseSettings.voiceURI);
            const langPrefix = targetLanguage === 'eu' ? 'eu' : 'en';
            if (voice && (voice.lang.startsWith(langPrefix) || (langPrefix === 'en' && voice.lang.startsWith('en')))) {
                utterance.voice = voice;
            }
        }

        window.speechSynthesis.speak(utterance);
    }, [phraseSettings, targetLanguage]);

    const cancel = useCallback(() => {
        window.speechSynthesis.cancel();
    }, []);

    return { speak, cancel };
};
