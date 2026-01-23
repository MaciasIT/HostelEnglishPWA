import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act } from '@testing-library/react';
import { useAppStore } from './useAppStore';

// Mock the db module to avoid IndexedDB issues in tests
vi.mock('../db', () => ({
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
}));

describe('useAppStore - Language Support', () => {
    beforeEach(() => {
        useAppStore.setState({
            prefs: {
                targetLanguage: 'en',
                theme: 'light',
                audioSpeed: 1,
                conversationSettings: {},
                phraseSettings: { voiceURI: '', rate: 1, pitch: 1 }
            }
        });
    });

    it('should default to "en" target language', () => {
        const state = useAppStore.getState();
        expect(state.prefs.targetLanguage).toBe('en');
    });

    it('should allow setting target language to "eu"', () => {
        const { setTargetLanguage } = useAppStore.getState();
        act(() => {
            setTargetLanguage('eu');
        });
        expect(useAppStore.getState().prefs.targetLanguage).toBe('eu');
    });

    it('should allow setting target language back to "en"', () => {
        const { setTargetLanguage } = useAppStore.getState();
        act(() => {
            setTargetLanguage('eu');
            setTargetLanguage('en');
        });
        expect(useAppStore.getState().prefs.targetLanguage).toBe('en');
    });
});
