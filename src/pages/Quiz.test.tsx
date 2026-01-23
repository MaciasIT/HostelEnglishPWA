import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Quiz from './Quiz';
import { useAppStore } from '@/store/useAppStore';
import { MemoryRouter } from 'react-router-dom';

vi.mock('@/store/useAppStore');

const mockFrases = [
    { id: '1', es: 'Hola', en: 'Hello', categoria: 'Saludos' },
    { id: '2', es: 'Adiós', en: 'Goodbye', categoria: 'Saludos' },
    { id: '3', es: 'Gracias', en: 'Thank you', categoria: 'General' },
    { id: '4', es: 'Por favor', en: 'Please', categoria: 'General' },
    { id: '5', es: 'Lo siento', en: 'Sorry', categoria: 'General' },
];

const mockState = {
    frases: mockFrases,
    frasesLoaded: true,
    loadFrases: vi.fn(),
    prefs: {
        phraseSettings: {
            voiceURI: 'mock-voice',
            rate: 1,
            pitch: 1,
        },
    },
};

const renderQuizComponent = (initialState = mockState) => {
    vi.mocked(useAppStore).mockImplementation((selector) => {
        if (selector) {
            return selector(initialState);
        }
        return initialState;
    });

    render(
        <MemoryRouter>
            <Quiz />
        </MemoryRouter>
    );
};

describe('Quiz Page', () => {

    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    it('debería renderizar la pantalla de bienvenida inicialmente', () => {
        renderQuizComponent();
        expect(screen.getByText('Módulo de Quiz')).toBeInTheDocument();
        expect(screen.getByText('Comenzar Quiz')).toBeInTheDocument();
    });

    it('debería comenzar el quiz y mostrar la primera pregunta', () => {
        renderQuizComponent();
        fireEvent.click(screen.getByText('Comenzar Quiz'));

        // Debería mostrar alguna de las frases en español
        const possibleQuestions = mockFrases.map(f => f.es);
        const questionText = screen.getByTestId('quiz-question').textContent?.replace(/"/g, '');
        expect(possibleQuestions).toContain(questionText);

        // Debería haber 4 opciones
        const options = screen.getAllByRole('button').filter(b => b.classList.contains('quiz-option'));
        expect(options).toHaveLength(4);
    });

    it('debería mostrar feedback al seleccionar una respuesta', () => {
        renderQuizComponent();
        fireEvent.click(screen.getByText('Comenzar Quiz'));

        const options = screen.getAllByRole('button').filter(b => b.classList.contains('quiz-option'));
        fireEvent.click(options[0]);

        expect(screen.getByTestId('quiz-feedback')).toBeInTheDocument();
    });
});
