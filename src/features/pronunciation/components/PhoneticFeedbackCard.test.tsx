import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PhoneticFeedbackCard, { getWordLevel } from './PhoneticFeedbackCard';

const words = [
  { word: 'Hello', score: 95 },
  { word: 'special', score: 65, tip: 'Intenta pronunciar la s líquida sin añadir una e al inicio' },
  { word: 'room', score: 20, tip: 'Alarga la vocal.' },
];
const scores = { accuracy: 80, fluency: 70, prosody: 60, completeness: 100 };

describe('PhoneticFeedbackCard', () => {
  it('clasifica niveles por puntuación', () => {
    expect(getWordLevel(90)).toBe('good');
    expect(getWordLevel(65)).toBe('warning');
    expect(getWordLevel(10)).toBe('bad');
  });

  it('renderiza palabras con código de color semántico', () => {
    render(<PhoneticFeedbackCard words={words} scores={scores} />);
    expect(screen.getByLabelText(/^Hello,/)).toHaveAttribute('data-level', 'good');
    expect(screen.getByLabelText(/^special,/)).toHaveAttribute('data-level', 'warning');
    expect(screen.getByLabelText(/^room,/)).toHaveAttribute('data-level', 'bad');
  });

  it('muestra y oculta el tooltip al pulsar palabras con advertencia', () => {
    render(<PhoneticFeedbackCard words={words} scores={scores} />);
    expect(screen.queryByRole('tooltip')).toBeNull();
    const btn = screen.getByRole('button', { name: /^special,/ });
    fireEvent.click(btn);
    expect(screen.getByRole('tooltip')).toHaveTextContent('s líquida');
    fireEvent.click(btn);
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('las palabras verdes no son interactivas', () => {
    render(<PhoneticFeedbackCard words={words} scores={scores} />);
    expect(screen.queryByRole('button', { name: /^Hello,/ })).toBeNull();
  });

  it('renderiza la gráfica radial con 4 ejes', () => {
    render(<PhoneticFeedbackCard words={words} scores={scores} />);
    const chart = screen.getByRole('img');
    expect(chart.getAttribute('aria-label')).toMatch(/Precisión Léxica 80.*Ritmo\/Fluidez 70.*Entonación 60.*Completitud 100/);
  });

  it('dispara reproducción de referencia y usuario', () => {
    const ref = vi.fn();
    const usr = vi.fn();
    render(<PhoneticFeedbackCard words={words} scores={scores} onPlayReference={ref} onPlayUser={usr} />);
    fireEvent.click(screen.getByRole('button', { name: /Escuchar nativo/ }));
    fireEvent.click(screen.getByRole('button', { name: /Escuchar mi grabación/ }));
    expect(ref).toHaveBeenCalledTimes(1);
    expect(usr).toHaveBeenCalledTimes(1);
  });
});
