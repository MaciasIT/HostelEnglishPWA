import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
    categories: ['Saludos', 'General'],
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

    it('debería mostrar la intro y luego permitir seleccionar un modo de juego', async () => {
        const user = userEvent.setup();
        renderQuizComponent();
        await user.click(screen.getByText(/Empezar Ahora/i));
        expect(await screen.findByText('Selecciona tu especialidad y el tipo de entrenamiento que prefieres hoy.')).toBeInTheDocument();
        expect(screen.getByText('Opción Múltiple')).toBeInTheDocument();
        expect(screen.getByText('Verdadero / Falso')).toBeInTheDocument();
    });

    it('debería comenzar el modo Opción Múltiple y mostrar opciones', async () => {
        const user = userEvent.setup();
        renderQuizComponent();
        await user.click(screen.getByText(/Empezar Ahora/i));

        const modeBtn = await screen.findByText('Opción Múltiple');
        await user.click(modeBtn);
        await user.click(screen.getByText('¡EMPEZAR ENTRENAMIENTO!'));

        // Las opciones en múltiples tienen clases dinámicas, pero podemos buscarlas por rol
        const options = await screen.findAllByRole('button');
        const answerOptions = options.filter(b => b.textContent && b.textContent.length > 5 && b.textContent !== '¡EMPEZAR ENTRENAMIENTO!');
        expect(answerOptions.length).toBeGreaterThan(0);
    });

    it('debería comenzar el modo Verdadero/Falso y mostrar 2 opciones', async () => {
        const user = userEvent.setup();
        renderQuizComponent();
        await user.click(screen.getByText(/Empezar Ahora/i));

        const modeBtn = await screen.findByText('Verdadero / Falso');
        await user.click(modeBtn);
        await user.click(screen.getByText('¡EMPEZAR ENTRENAMIENTO!'));

        expect(await screen.findByText('Identifica si es correcto')).toBeInTheDocument();
        const trueBtn = screen.getByText('SÍ');
        const falseBtn = screen.getByText('NO');
        expect(trueBtn).toBeInTheDocument();
        expect(falseBtn).toBeInTheDocument();
    });
});
