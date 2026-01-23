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
        vi.mocked(useAppStore).mockReturnValue({
            frases: mockFrases,
            frasesLoaded: true,
            loadFrases: vi.fn(),
            advancePhraseProgress: vi.fn(),
            progress: {},
            prefs: { phraseSettings: { rate: 1, pitch: 1, voiceURI: '' } }
        });
    });

    it('renders the welcome screen initially', () => {
        render(
            <HashRouter>
                <Examen />
            </HashRouter>
        );
        expect(screen.getByText('Módulo de Examen')).toBeDefined();
        expect(screen.getByText('Empezar Ahora')).toBeDefined();
    });

    it('shows exam setup after clicking start', () => {
        render(
            <HashRouter>
                <Examen />
            </HashRouter>
        );
        fireEvent.click(screen.getByText('Empezar Ahora'));
        expect(screen.getByText('Configura tu Examen')).toBeDefined();
        expect(screen.getByText('Examen Global')).toBeDefined();
    });

    it('starts the exam and shows the first question', () => {
        render(
            <HashRouter>
                <Examen />
            </HashRouter>
        );
        fireEvent.click(screen.getByText('Empezar Ahora'));
        fireEvent.click(screen.getByText('Comenzar Examen'));

        // Should show a question index
        expect(screen.getByText(/Pregunta #1/)).toBeDefined();
    });

    it('completes the exam and shows results', async () => {
        // For TDD, we expect a summary at the end
        // This might require mocking more of the exam flow if it's many questions
        // But let's assume we implement a short exam or easy way to skip.
    });
});
