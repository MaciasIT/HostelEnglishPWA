import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PostSessionSummaryModal from './PostSessionSummaryModal';
import { calculateFluency } from '../lib/fluency';

const fluency = calculateFluency({ avgSecondsPerPhrase: 7, phoneticAccuracy: 80, roleplaysResolved: 3, roleplaysAttempted: 4 });
const base = { open: true, onClose: () => {}, xpEarned: 45, streak: 6, fluency, weakPhrases: [{ id: '1', text: 'Could I see your passport?' }] };

describe('PostSessionSummaryModal', () => {
  it('no renderiza si está cerrado', () => {
    render(<PostSessionSummaryModal {...base} open={false} />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });
  it('muestra XP, racha, fluidez y frases', () => {
    render(<PostSessionSummaryModal {...base} />);
    expect(screen.getByTestId('xp-earned').textContent).toBe('+45 XP');
    expect(screen.getByTestId('streak').textContent).toContain('6');
    expect(screen.getByTestId('fluency-score').textContent).toBe('70');
    expect(screen.getByText('Could I see your passport?')).toBeDefined();
    expect(screen.getAllByRole('progressbar')).toHaveLength(3);
  });
  it('mensaje vacío sin frases débiles y cierra con Escape', () => {
    const onClose = vi.fn();
    render(<PostSessionSummaryModal {...base} weakPhrases={[]} onClose={onClose} />);
    expect(screen.getByText('¡Nada que reforzar hoy!')).toBeDefined();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
  it('botón de diploma opcional', () => {
    const fn = vi.fn();
    render(<PostSessionSummaryModal {...base} onDownloadDiploma={fn} />);
    fireEvent.click(screen.getByText('Descargar diploma'));
    expect(fn).toHaveBeenCalled();
  });
});
