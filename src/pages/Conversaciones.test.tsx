import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Conversaciones from './Conversaciones';
import { useAppStore } from '@/store/useAppStore';
import React from 'react';

vi.mock('@/store/useAppStore');

const mockConversations = [
	{
		id: 1,
		title: 'Check-in',
		description: 'A guest is checking in.',
		categoria: 'Recepción',
		participants: ['Hostel Staff', 'Guest'],
		dialogue: [
			{
				speaker: 'Hostel Staff',
				en: 'Welcome! How can I help?',
				es: '¡Bienvenido! ¿Cómo puedo ayudarle?',
			},
			{ speaker: 'Guest', en: 'I have a reservation.', es: 'Tengo una reserva.' },
		],
	},
	{
		id: 2,
		title: 'Ordering a drink',
		description: 'A guest orders a drink at the bar.',
		categoria: 'Bar',
		participants: ['Bartender', 'Guest'],
		dialogue: [
			{ speaker: 'Bartender', en: 'What can I get you?', es: '¿Qué le pongo?' },
			{ speaker: 'Guest', en: 'A beer, please.', es: 'Una cerveza, por favor.' },
		],
	},
];

const mockCategories = ['Recepción', 'Bar'];

const mockConversationSettings = {
	'Hostel Staff': { voiceURI: 'default', rate: 1, pitch: 1 },
	'Guest': { voiceURI: 'default', rate: 1, pitch: 1 },
	'Bartender': { voiceURI: 'default', rate: 1, pitch: 1 },
};

// Mock de speechSynthesis
(globalThis as any).speechSynthesis = {
	getVoices: () => [],
	speak: vi.fn(),
	cancel: vi.fn(),
	addEventListener: vi.fn(),
	removeEventListener: vi.fn(),
} as any;

(globalThis as any).SpeechSynthesisUtterance = function (text: string) {
	this.text = text;
	this.lang = '';
	this.rate = 1;
	this.pitch = 1;
};

describe('<Conversaciones />', () => {
	const mockState = {
		conversations: mockConversations,
		conversationsLoaded: true,
		categories: mockCategories,
		prefs: {
			targetLanguage: 'en',
			theme: 'light',
			audioSpeed: 1,
			conversationSettings: mockConversationSettings,
		},
		setConversationParticipantSetting: vi.fn(),
		loadConversations: vi.fn(),
		loadFrases: vi.fn(),
		initializeCategories: vi.fn(),
		advancePhraseProgress: vi.fn(),
		setTheme: vi.fn(),
		setAudioSpeed: vi.fn(),
		toggleSideNav: vi.fn(),
	};

	beforeEach(() => {
		vi.mocked(useAppStore).mockImplementation((selector: any) => {
			if (typeof selector === 'function') return selector(mockState);
			return mockState;
		});
	});

	afterEach(() => {
		cleanup();
		vi.clearAllMocks();
	});

	const renderComponentAndStart = () => {
		render(
			<MemoryRouter>
				<Conversaciones />
			</MemoryRouter>
		);
		const startButton = screen.getByText(/Empezar Ahora/i);
		fireEvent.click(startButton);
	};

	it('should render the list of conversations and filter', () => {
		renderComponentAndStart();
		expect(screen.getByText('Check-in')).toBeInTheDocument();
		expect(screen.getByText('Ordering a drink')).toBeInTheDocument();
		expect(screen.getByLabelText(/filtrar por categoría/i)).toBeInTheDocument();
	});

	it('should filter conversations when a category is selected', async () => {
		const user = userEvent.setup();
		renderComponentAndStart();

		await user.selectOptions(screen.getByLabelText(/filtrar por categoría/i), 'Bar');

		expect(screen.queryByText('Check-in')).not.toBeInTheDocument();
		expect(screen.getByText('Ordering a drink')).toBeInTheDocument();
	});

	it('should navigate to detail view on conversation click and back', async () => {
		const user = userEvent.setup();
		renderComponentAndStart();

		// Navegar a la vista de detalle
		await user.click(screen.getByText('Check-in'));

		// Título del diálogo
		expect(screen.getByText('Check-in')).toBeInTheDocument();
		expect(screen.getByText('Welcome! How can I help?')).toBeInTheDocument();

		// Volver a la lista
		await user.click(screen.getByRole('button', { name: /volver/i }));
		expect(screen.getByText('Ordering a drink')).toBeInTheDocument();
	});

	it('should hide user text when a role is selected in detail view', async () => {
		const user = userEvent.setup();
		renderComponentAndStart();

		// Navegar a la vista de detalle
		await user.click(screen.getByText('Check-in'));

		// Seleccionar el rol 'Guest' vía botón
		await user.click(screen.getByText(/Ser Guest/i));

		// El texto del Guest debería estar oculto y reemplazado
		expect(screen.getByText(/TU TURNO/i)).toBeInTheDocument();
		expect(screen.queryByText('I have a reservation.')).not.toBeInTheDocument();
		// El texto del Staff debería seguir visible
		expect(screen.getByText('Welcome! How can I help?')).toBeInTheDocument();
	});
});
