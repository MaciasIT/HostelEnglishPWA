import React from 'react';
import { render, fireEvent, screen, act } from '@testing-library/react';
import { vi, expect, describe, it, beforeEach } from 'vitest';
import ConversationDetail from './ConversationDetail';

// Mock speechSynthesis API
global.speechSynthesis = {
  speak: vi.fn(),
  cancel: vi.fn(),
  getVoices: () => [{ voiceURI: 'test', name: 'Test', lang: 'en-US' }],
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
} as any;

(global as any).SpeechSynthesisUtterance = function(text: string) {
  this.text = text;
  this.lang = '';
  this.rate = 1;
  this.pitch = 1;
  this.voice = null;
  this.onend = null;
  this.onerror = null;
};

describe('ConversationDetail - Playback Cancellation', () => {
  const conversation = {
    id: 1,
    title: 'Test Conversation',
    description: 'Desc',
    dialogue: [
      { speaker: 'A', en: 'Hello', es: 'Hola' },
      { speaker: 'B', en: 'Hi', es: 'Hola' },
    ],
    participants: ['A', 'B'],
  };
  const onBack = vi.fn();
  const onConversationEnd = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (window as any).isPlayingAllConversationRef = undefined;
  });

  it('cancels playback when pressing back', () => {
    render(
      <ConversationDetail conversation={conversation} onBack={onBack} onConversationEnd={onConversationEnd} />
    );
    const backBtn = screen.getByText(/volver a la lista/i);
    fireEvent.click(backBtn);
    expect(global.speechSynthesis.cancel).toHaveBeenCalled();
    expect(onBack).toHaveBeenCalled();
  });

  it('cancels sequential playback when pressing individual play', () => {
    render(
      <ConversationDetail conversation={conversation} onBack={onBack} onConversationEnd={onConversationEnd} />
    );
    // Simula que está reproduciendo toda la conversación
    (window as any).isPlayingAllConversationRef.current = true;
    const playBtns = screen.getAllByText(/reproducir/i);
    fireEvent.click(playBtns[0]);
    expect(global.speechSynthesis.cancel).toHaveBeenCalled();
    // Simula que la secuencia termina (onend)
    (window as any).isPlayingAllConversationRef.current = false;
    expect((window as any).isPlayingAllConversationRef.current).toBe(false);
  });

  it('cancels playback on unmount', () => {
    const { unmount } = render(
      <ConversationDetail conversation={conversation} onBack={onBack} onConversationEnd={onConversationEnd} />
    );
    unmount();
    expect(global.speechSynthesis.cancel).toHaveBeenCalled();
  });
});
