import { useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { playAudio } from '@/utils/audio';

export const useSpeech = () => {
    const { prefs } = useAppStore();
    const { phraseSettings, targetLanguage } = prefs;

    const speak = useCallback(async (text: string, lang?: 'en' | 'eu' | 'es') => {
        // Correctly identify language if not provided
        // In Quiz, we usually play the target language (en/eu)
        // But if we want to support Spanish playback in the future, we need this check.
        const langCode = lang || (targetLanguage === 'eu' ? 'eu' : 'en');

        await playAudio(text, langCode, {
            rate: phraseSettings.rate,
            pitch: phraseSettings.pitch,
            voiceURI: langCode === 'es' ? undefined : phraseSettings.voiceURI
        });
    }, [phraseSettings, targetLanguage]);

    const cancel = useCallback(() => {
        window.speechSynthesis.cancel();
    }, []);

    return { speak, cancel };
};
