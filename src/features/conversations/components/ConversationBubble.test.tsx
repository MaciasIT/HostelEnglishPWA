import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ConversationBubble from './ConversationBubble';

const turn = { speaker: 'Camarero', en: 'Welcome, table for two?', es: 'Bienvenidos, ¿mesa para dos?', eu: '' } as never;

const base = {
  turn,
  isParticipant0: true,
  targetLanguage: 'en',
  onPlay: vi.fn(),
  index: 0,
};

describe('ConversationBubble — Tu turno', () => {
  it.each([true, false])('mantiene visible la frase en tu turno (focus=%s)', (isFocusMode) => {
    render(<ConversationBubble {...base} isMyTurn isFocusMode={isFocusMode} />);
    expect(screen.getByText('Welcome, table for two?')).toBeTruthy();
    expect(screen.getByText('Bienvenidos, ¿mesa para dos?')).toBeTruthy();
    expect(screen.getByRole('status').textContent).toMatch(/TU TURNO/);
  });

  it('muestra Escuchar, Ocultar pista y Continuar en modo focus', () => {
    const onContinue = vi.fn();
    const onPlay = vi.fn();
    render(<ConversationBubble {...base} onPlay={onPlay} isMyTurn isFocusMode onContinue={onContinue} />);
    fireEvent.click(screen.getByLabelText('Escuchar cómo suena la frase'));
    expect(onPlay).toHaveBeenCalled();
    fireEvent.click(screen.getByText('Continuar ▶'));
    expect(onContinue).toHaveBeenCalled();
    fireEvent.click(screen.getByText('Ocultar pista'));
    expect(screen.queryByText('Welcome, table for two?')).toBeNull();
    fireEvent.click(screen.getByText('Mostrar'));
    expect(screen.getByText('Welcome, table for two?')).toBeTruthy();
  });

  it('turno del interlocutor sin badge', () => {
    render(<ConversationBubble {...base} isMyTurn={false} isFocusMode />);
    expect(screen.getByText('Welcome, table for two?')).toBeTruthy();
    expect(screen.queryByRole('status')).toBeNull();
  });
});
