import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AudioStatusRegion, { getAudioStatusMessage } from './AudioStatusRegion';

describe('getAudioStatusMessage', () => {
  it('anuncia reproducción, grabación y resultado', () => {
    expect(getAudioStatusMessage('playing')).toBe('Reproduciendo audio');
    expect(getAudioStatusMessage('recording')).toBe('Grabando, habla ahora');
    expect(getAudioStatusMessage('result', true)).toBe('Resultado: correcto');
    expect(getAudioStatusMessage('result', false)).toBe('Resultado: incorrecto');
  });

  it('no anuncia nada en reposo ni resultado sin valor', () => {
    expect(getAudioStatusMessage('idle')).toBe('');
    expect(getAudioStatusMessage('result')).toBe('');
  });
});

describe('AudioStatusRegion', () => {
  it('es una región polite oculta visualmente con el mensaje actual', () => {
    render(<AudioStatusRegion status="recording" />);
    const region = screen.getByRole('status');
    expect(region.getAttribute('aria-live')).toBe('polite');
    expect(region.getAttribute('aria-atomic')).toBe('true');
    expect(region.className).toContain('sr-only');
    expect(region.textContent).toBe('Grabando, habla ahora');
  });
});
