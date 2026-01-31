import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Quiz from './Quiz';
import { useAppStore } from '@/store/useAppStore';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

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
    progress: {},
    advancePhraseProgress: vi.fn(),
    prefs: {
        targetLanguage: 'en',
        phraseSettings: {
            voiceURI: 'mock-voice',
            rate: 1,
            pitch: 1,
        },
    },
    setPhraseSetting: vi.fn(),
};

const renderQuizComponent = (initialState: any = mockState) => {
    vi.mocked(useAppStore).mockImplementation((selector: any) => {
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

    it('debería mostrar la intro y luego permitir seleccionar un modo de juego', () => {
        renderQuizComponent();
        fireEvent.click(screen.getByText(/Empezar Ahora/i));
        expect(screen.getByText('Elige tu desafío')).toBeInTheDocument();
        expect(screen.getAllByText('Opción Múltiple').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Verdadero/Falso').length).toBeGreaterThan(0);
    });

    it('debería comenzar el modo Opción Múltiple y mostrar opciones', () => {
        renderQuizComponent();
        fireEvent.click(screen.getByText(/Empezar Ahora/i));

        const modeBtn = screen.getAllByText('Opción Múltiple')[0];
        fireEvent.click(modeBtn);
        fireEvent.click(screen.getByText('COMENZAR DESAFÍO'));

        // Las opciones en múltiples tienen clases dinámicas, pero podemos buscarlas por rol
        const options = screen.getAllByRole('button').filter(b => b.textContent && b.textContent.length > 5);
        expect(options.length).toBeGreaterThan(0);
    });

    it('debería comenzar el modo Verdadero/Falso y mostrar 2 opciones', () => {
        renderQuizComponent();
        fireEvent.click(screen.getByText(/Empezar Ahora/i));

        const modeBtn = screen.getAllByText('Verdadero/Falso')[0];
        fireEvent.click(modeBtn);
        fireEvent.click(screen.getByText('COMENZAR DESAFÍO'));

        expect(screen.getByText('Identifica si es correcto')).toBeInTheDocument();
        const trueBtn = screen.getByText('SÍ');
        const falseBtn = screen.getByText('NO');
        expect(trueBtn).toBeInTheDocument();
        expect(falseBtn).toBeInTheDocument();

        fireEvent.click(trueBtn);
        expect(screen.getByTestId('quiz-feedback')).toBeInTheDocument();
    });
});
