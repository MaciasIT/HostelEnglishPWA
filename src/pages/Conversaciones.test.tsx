import { render, screen } from '@testing-library/react';
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

	const renderComponent = () => {
		return render(
			<MemoryRouter>
				<Conversaciones />
			</MemoryRouter>
		);
	};

	it('should render the list of conversations and filter', () => {
		renderComponent();
	// Puede haber múltiples elementos con el mismo texto, así que usamos getAllByText y comprobamos que existan
	expect(screen.getAllByText('Check-in')[0]).to.exist;
	expect(screen.getAllByText('Ordering a drink')[0]).to.exist;
	expect(screen.getByLabelText(/filtrar por categoría/i)).to.exist;
	});

	it('should filter conversations when a category is selected', async () => {
		const user = userEvent.setup();
		renderComponent();

		await user.selectOptions(screen.getByLabelText(/filtrar por categoría/i), 'Bar');

	expect(screen.getAllByText('Ordering a drink')[0]).to.exist;
	// Si no hay ningún elemento con 'Check-in', getAllByText lanzará, así que usamos queryAllByText
	// Solo debe estar visible 'Ordering a drink' en la lista (h2)
	const lists = screen.getAllByTestId('conversation-list');
	const list = lists[lists.length - 1]; // El último es el render actual
	const h2s = Array.from(list.querySelectorAll('h2'));
	const h2Texts = h2s.map(h => h.textContent);
	expect(h2Texts).to.include('Ordering a drink');
	expect(h2Texts).to.not.include('Check-in');
	});

	it('should navigate to detail view on conversation click and back', async () => {
		const user = userEvent.setup();
		renderComponent();

		// Navegar a la vista de detalle
	// Seleccionamos el primer elemento con el texto 'Check-in' (el de la lista)
	await user.click(screen.getAllByText('Check-in')[0]);

	// Hay más de un heading con el mismo nombre, seleccionamos el h1
	const headings = screen.getAllByRole('heading', { name: 'Check-in' });
	// h1 tiene aria-level=1
	const h1 = headings.find(h => h.tagName === 'H1');
	expect(h1).to.exist;
	expect(screen.getByText('Welcome! How can I help?')).to.exist;

		// Volver a la lista
	await user.click(screen.getByRole('button', { name: /volver/i }));
	expect(screen.getAllByText('Ordering a drink')[0]).to.exist;
	});

	it('should hide user text when a role is selected in detail view', async () => {
		const user = userEvent.setup();
		renderComponent();

		// Navegar a la vista de detalle
	await user.click(screen.getAllByText('Check-in')[0]);

		// Seleccionar el rol 'Guest'
		await user.selectOptions(screen.getByLabelText(/tu rol/i), 'Guest');

		// El texto del Guest debería estar oculto y reemplazado
	expect(screen.getByText('Tu turno...')).to.exist;
	expect(screen.queryByText('I have a reservation.')).to.be.null;
		// El texto del Staff debería seguir visible
	expect(screen.getByText('Welcome! How can I help?')).to.exist;
	});
});
