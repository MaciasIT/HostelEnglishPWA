import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { vi, expect, describe, it, beforeEach } from 'vitest';
import ConversationDetail from './ConversationDetail';

// Mock speechSynthesis API
(globalThis as any).speechSynthesis = {
  speak: vi.fn(),
  cancel: vi.fn(),
  getVoices: () => [{ voiceURI: 'test', name: 'Test', lang: 'en-US' }],
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
} as any;

(globalThis as any).SpeechSynthesisUtterance = function (text: string) {
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
  });

  it('cancels playback when pressing back', () => {
    render(
      <ConversationDetail conversation={conversation} onBack={onBack} onConversationEnd={onConversationEnd} />
    );
    const backBtn = screen.getByLabelText(/volver/i);
    fireEvent.click(backBtn);
    expect((globalThis as any).speechSynthesis.cancel).toHaveBeenCalled();
    expect(onBack).toHaveBeenCalled();
  });

  it('cancels sequential playback when pressing individual play', () => {
    render(
      <ConversationDetail conversation={conversation} onBack={onBack} onConversationEnd={onConversationEnd} />
    );
    const playAllBtn = screen.getByText(/reproducir todo/i);
    fireEvent.click(playAllBtn);

    const playBtns = screen.getAllByLabelText(/reproducir frase/i);
    fireEvent.click(playBtns[0]);

    expect((globalThis as any).speechSynthesis.cancel).toHaveBeenCalled();
  });

  it('cancels playback on unmount', () => {
    const { unmount } = render(
      <ConversationDetail conversation={conversation} onBack={onBack} onConversationEnd={onConversationEnd} />
    );
    unmount();
    expect((globalThis as any).speechSynthesis.cancel).toHaveBeenCalled();
  });
});
