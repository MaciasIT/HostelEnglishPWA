import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock de la API de Síntesis de Voz del navegador para el entorno JSDOM
Object.defineProperty(window, 'speechSynthesis', {
  value: {
    cancel: vi.fn(),
    speak: vi.fn(),
    getVoices: vi.fn(() => []),
    pause: vi.fn(),
    resume: vi.fn(),
    paused: false,
    pending: false,
    speaking: false,
    onvoiceschanged: null,
  },
  writable: true,
});

// Mock de la clase SpeechSynthesisUtterance
global.window.SpeechSynthesisUtterance = class SpeechSynthesisUtterance {
  constructor(text) {
    this.text = text;
    this.lang = '';
    this.pitch = 1;
    this.rate = 1;
    this.voice = null;
    this.volume = 1;
  }
};
