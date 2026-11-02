import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import VoiceSettings, { accentOf } from './VoiceSettings';

const mkVoice = (name: string, lang: string) => ({ name, lang, voiceURI: name }) as SpeechSynthesisVoice;

describe('VoiceSettings', () => {
  const speak = vi.fn();
  beforeEach(() => {
    speak.mockClear();
    vi.stubGlobal('SpeechSynthesisUtterance', function (this: Record<string, unknown>, text: string) {
      this.text = text;
    });
    (window as unknown as { speechSynthesis: unknown }).speechSynthesis = {
      getVoices: () => [mkVoice('Google UK English Male', 'en-GB'), mkVoice('Samantha', 'en-US'), mkVoice('Daniel', 'en_GB')],
      cancel: vi.fn(),
      speak,
      onvoiceschanged: null,
    };
  });

  it('accentOf tolera guion bajo', () => {
    expect(accentOf('en_GB')).toBe('GB');
    expect(accentOf('en-AU')).toBe('AU');
  });

  it('abre el sheet, cambia acento y velocidad por chips y prueba la voz', () => {
    const onChange = vi.fn();
    render(<VoiceSettings settings={{ voiceURI: '', rate: 1, pitch: 1 }} onSettingChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /Ajustes de Voz/ }));
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.queryByRole('combobox')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /Americano/ }));
    expect(onChange).toHaveBeenCalledWith('voiceURI', 'Samantha');

    fireEvent.click(screen.getByRole('button', { name: /0\.8x/ }));
    expect(onChange).toHaveBeenCalledWith('rate', 0.8);

    fireEvent.click(screen.getByRole('button', { name: /Probar voz/ }));
    expect(speak).toHaveBeenCalledTimes(1);

    expect(screen.queryByLabelText('Tono')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Avanzado/ }));
    expect(screen.getByLabelText('Tono')).toBeTruthy();
  });

  it('nombra voces amigables cuando hay varias del mismo acento', () => {
    render(<VoiceSettings settings={{ voiceURI: 'Daniel', rate: 1, pitch: 1 }} onSettingChange={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /Ajustes de Voz/ }));
    expect(screen.getByRole('button', { name: /Voz 1 \(Natural\)/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Voz 2 \(Clara\)/ })).toBeTruthy();
  });
});
