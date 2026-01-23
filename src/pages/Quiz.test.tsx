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

    it('debería permitir seleccionar un modo de juego inicialmente', () => {
        renderQuizComponent();
        expect(screen.getByText('Selecciona un modo:')).toBeInTheDocument();
        expect(screen.getAllByText('Opción Múltiple').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Verdadero o Falso').length).toBeGreaterThan(0);
    });

    it('debería comenzar el modo Opción Múltiple y mostrar 4 opciones', () => {
        renderQuizComponent();
        // Target specifically the button in the mode selector
        const modeBtn = screen.getAllByText('Opción Múltiple')[0];
        fireEvent.click(modeBtn);
        fireEvent.click(screen.getByText('Comenzar Quiz'));

        const options = screen.getAllByRole('button').filter(b => b.classList.contains('quiz-option'));
        expect(options).toHaveLength(4);
    });

    it('debería comenzar el modo Verdadero o Falso y mostrar 2 opciones', () => {
        renderQuizComponent();
        const modeBtn = screen.getAllByText('Verdadero o Falso')[0];
        fireEvent.click(modeBtn);
        fireEvent.click(screen.getByText('Comenzar Quiz'));

        expect(screen.getByText('¿Es esta traducción correcta?')).toBeInTheDocument();
        const trueBtn = screen.getByText('Verdadero');
        const falseBtn = screen.getByText('Falso');
        expect(trueBtn).toBeInTheDocument();
        expect(falseBtn).toBeInTheDocument();

        fireEvent.click(trueBtn);
        expect(screen.getByTestId('quiz-feedback')).toBeInTheDocument();
    });

    it('debería mostrar feedback al seleccionar una respuesta en Opción Múltiple', () => {
        renderQuizComponent();
        fireEvent.click(screen.getAllByText('Opción Múltiple')[0]);
        fireEvent.click(screen.getByText('Comenzar Quiz'));

        const options = screen.getAllByRole('button').filter(b => b.classList.contains('quiz-option'));
        fireEvent.click(options[0]);

        expect(screen.getByTestId('quiz-feedback')).toBeInTheDocument();
    });
});
