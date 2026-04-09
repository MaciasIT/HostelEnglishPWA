/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import QuizContainer from './QuizContainer';

// Mock dependencies
const mockState = {
  frases: [
    { id: 1, es: 'Hola', en: 'Hello', eu: 'Kaixo', categoria: 'General' },
    { id: 2, es: 'Adiós', en: 'Goodbye', eu: 'Agur', categoria: 'General' },
    { id: 3, es: 'Gracias', en: 'Thanks', eu: 'Eskerrik asko', categoria: 'General' },
    { id: 4, es: 'Por favor', en: 'Please', eu: 'Mesedez', categoria: 'General' }
  ],
  progress: {},
  advancePhraseProgress: vi.fn(),
  prefs: {
      targetLanguage: 'en',
      phraseSettings: { rate: 1, pitch: 1, voiceURI: '' }
  }
};

vi.mock('@/store/useAppStore', () => ({
  useAppStore: (selector: any) => {
    return selector ? selector(mockState) : mockState;
  }
}));

// Mock SpeechSynthesis
Object.defineProperty(window, 'speechSynthesis', {
  value: {
    cancel: vi.fn(),
    speak: vi.fn(),
    getVoices: vi.fn(() => []),
  },
  writable: true,
});

describe('QuizContainer', () => {
    it('should render and show the first question in multiple choice mode', () => {
        render(<QuizContainer category="General" mode="multiple" onExit={vi.fn()} />);
        
        // Wait for question to be generated/rendered
        expect(screen.getByTestId('quiz-container')).toBeDefined();
        expect(screen.getByTestId('quiz-question')).toBeDefined();
        
        // Check if multiple choice options are rendered (A, B, C, D)
        expect(screen.getByText('A')).toBeDefined();
        expect(screen.getByText('B')).toBeDefined();
        expect(screen.getByText('C')).toBeDefined();
        expect(screen.getByText('D')).toBeDefined();
    });
});
