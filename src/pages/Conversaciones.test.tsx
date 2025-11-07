import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Conversaciones from './Conversaciones';
import { useAppStore } from '@/store/useAppStore';

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

// Mock de speechSynthesis para entorno de test
globalThis.window.speechSynthesis = {
	getVoices: () => [],
	speak: () => {},
	cancel: () => {},
	addEventListener: () => {},
	removeEventListener: () => {},
} as any;

describe('<Conversaciones />', () => {
	beforeEach(() => {
		vi.mocked(useAppStore).mockReturnValue({
			conversations: mockConversations,
			categories: mockCategories,
			prefs: {
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
		});
	});

	const renderComponentAndStart = () => {
		render(
			<MemoryRouter>
				<Conversaciones />
			</MemoryRouter>
		);
		const startButton = screen.getByText('Empezar a Practicar');
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

		// Hay más de un heading con el mismo nombre, seleccionamos el h1
		expect(screen.getByRole('heading', { name: 'Check-in', level: 1 })).toBeInTheDocument();
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

		// Seleccionar el rol 'Guest'
		await user.selectOptions(screen.getByLabelText(/tu rol/i), 'Guest');

		// El texto del Guest debería estar oculto y reemplazado
		expect(screen.getByText('Tu turno...')).toBeInTheDocument();
		expect(screen.queryByText('I have a reservation.')).not.toBeInTheDocument();
		// El texto del Staff debería seguir visible
		expect(screen.getByText('Welcome! How can I help?')).toBeInTheDocument();
	});
});
