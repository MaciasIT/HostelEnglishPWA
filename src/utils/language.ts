import { Phrase } from '@/store/useAppStore';

/**
 * Returns the text of the phrase in the target language.
 * Defaults to English if the target language is not available.
 * @param phrase The phrase object
 * @param targetLanguage The target language code ('en', 'eu', etc.)
 * @returns The translated text
 */
export const getTargetText = (phrase: Phrase, targetLanguage: string): string => {
    if (!phrase) return '';
    return (targetLanguage === 'eu' ? phrase.eu : phrase.en) || phrase.en;
};
