import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router';

import RushHour from './RushHour';
import { RUSH_HOUR_SITUATIONS, RUSH_HOUR_TOTAL_SITUATIONS } from '@/features/rushhour';

afterEach(() => cleanup());

const renderPage = () =>
  render(
    <MemoryRouter>
      <RushHour />
    </MemoryRouter>,
  );

/** Responde a la situación actual con una frase cortés y avanza. */
async function answerCurrent(user: ReturnType<typeof userEvent.setup>, text: string) {
  await user.type(screen.getByTestId('rush-hour-answer-input'), text);
  await user.click(screen.getByTestId('rush-hour-submit'));
}

describe('<RushHour />', () => {
  it('muestra la intro con el título y el botón de arranque', () => {
    renderPage();
    expect(screen.getByTestId('rush-hour-intro')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Hora Punta/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /COMENZAR RUSH HOUR/i })).toBeInTheDocument();
  });

  it('arranca la ronda mostrando la primera situación y el contador', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: /COMENZAR RUSH HOUR/i }));

    expect(screen.getByTestId('rush-hour-timer')).toBeInTheDocument();
    expect(screen.getByTestId('rush-hour-situation')).toHaveTextContent(
      RUSH_HOUR_SITUATIONS[0].prompt,
    );
    expect(screen.getByText(`1/${RUSH_HOUR_TOTAL_SITUATIONS}`)).toBeInTheDocument();
  });

  it('avanza de situación al responder y completa al responder las 5', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: /COMENZAR RUSH HOUR/i }));

    for (let i = 0; i < RUSH_HOUR_TOTAL_SITUATIONS; i++) {
      expect(screen.getByTestId('rush-hour-situation')).toHaveTextContent(
        RUSH_HOUR_SITUATIONS[i].prompt,
      );
      await answerCurrent(user, 'Of course, may I help you with that right away, please?');
    }

    expect(screen.getByTestId('rush-hour-summary')).toBeInTheDocument();
    expect(screen.getByText(/5 de 5/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /REPETIR/i })).toBeInTheDocument();
  });
});