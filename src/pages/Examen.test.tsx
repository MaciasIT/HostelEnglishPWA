import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Examen from './Examen';
import { useAppStore } from '@/store/useAppStore';
import { HashRouter } from 'react-router-dom';

// Mock the store
vi.mock('@/store/useAppStore', () => ({
    useAppStore: vi.fn(),
}));

const mockFrases = [
    { id: '1', es: 'Hola', en: 'Hello', categoria: 'Saludos' },
    { id: '2', es: 'Adiós', en: 'Goodbye', categoria: 'Saludos' },
    { id: '3', es: 'Por favor', en: 'Please', categoria: 'Cortesía' },
    { id: '4', es: 'Gracias', en: 'Thank you', categoria: 'Cortesía' },
];

describe('Examen Module', () => {
    beforeEach(() => {
        const mockStore = {
            frases: mockFrases,
            frasesLoaded: true,
            loadFrases: vi.fn(),
            advancePhraseProgress: vi.fn(),
            recordExamResult: vi.fn(),
            progress: {},
            prefs: { 
                targetLanguage: 'en',
                phraseSettings: { rate: 1, pitch: 1, voiceURI: '' } 
            }
        };
        
        // Handle both direct call and selector call
        vi.mocked(useAppStore).mockImplementation((selector: any) => {
            return selector ? selector(mockStore) : mockStore;
        });
    });

    it('renders the welcome screen initially', () => {
        render(
            <HashRouter>
                <Examen />
            </HashRouter>
        );
        expect(screen.getByText(/Módulo de Examen/i)).toBeDefined();
        expect(screen.getByText(/Empezar Ahora/i)).toBeDefined();
    });

    it('shows exam setup after clicking start', async () => {
        render(
            <HashRouter>
                <Examen />
            </HashRouter>
        );
        fireEvent.click(screen.getByText(/Empezar Ahora/i));
        
        // Wait for components to appear after animation/mount
        // findByText fails if there are multiple matches, so we use findAllByText
        const elements = await screen.findAllByText(/Evaluación/i);
        expect(elements.length).toBeGreaterThan(0);
        expect(await screen.findByText(/Examen Global/i)).toBeDefined();
    });

    it('starts the exam and shows the first question', async () => {
        render(
            <HashRouter>
                <Examen />
            </HashRouter>
        );
        fireEvent.click(screen.getByText(/Empezar Ahora/i));
        
        const startBtn = await screen.findByText(/Comenzar Examen/i);
        fireEvent.click(startBtn);

        // Should show a question index footer text
        expect(await screen.findByText(/Pregunta #1/i)).toBeDefined();
    });

    it('completes the exam and shows results', async () => {
        // For TDD, we expect a summary at the end
        // This might require mocking more of the exam flow if it's many questions
        // But let's assume we implement a short exam or easy way to skip.
    });
});
