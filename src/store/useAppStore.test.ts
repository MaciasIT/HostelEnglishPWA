import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAppStore } from './useAppStore';

// Mock the IndexedDB functions to prevent errors in test environment
vi.mock('../db', () => ({
  get: vi.fn(() => Promise.resolve(null)), // Mock get to return null initially
  set: vi.fn(() => Promise.resolve()),
  del: vi.fn(() => Promise.resolve()),
}));

describe('useAppStore - Conversation Settings', () => {
  // Reset the store before each test to ensure isolation
  beforeEach(() => {
    // Reset the Zustand store to its initial state
    useAppStore.setState({
      frases: [],
      conversations: [],
      categories: ['Estudiadas', 'Aprendidas'],
      frasesLoaded: false,
      conversationsLoaded: false,
      progress: {},
      prefs: {
        theme: 'light',
        audioSpeed: 1,
        conversationSettings: {},
      },
    });
    // Clear all mocks for idb functions
    vi.clearAllMocks();
  });

  it('should correctly update conversationSettings for a participant', () => {
    const participant = 'Camarero/a';
    const initialSettings = useAppStore.getState().prefs.conversationSettings;
    expect(initialSettings[participant]).toBeUndefined();

    // Set voiceURI
    useAppStore.getState().setConversationParticipantSetting(participant, 'voiceURI', 'Google US English');
    let updatedSettings = useAppStore.getState().prefs.conversationSettings;
    expect(updatedSettings[participant]).toEqual({
      voiceURI: 'Google US English',
      rate: 1,
      pitch: 1,
    });

    // Set rate
    useAppStore.getState().setConversationParticipantSetting(participant, 'rate', 1.5);
    updatedSettings = useAppStore.getState().prefs.conversationSettings;
    expect(updatedSettings[participant]).toEqual({
      voiceURI: 'Google US English',
      rate: 1.5,
      pitch: 1,
    });

    // Set pitch
    useAppStore.getState().setConversationParticipantSetting(participant, 'pitch', 0.8);
    updatedSettings = useAppStore.getState().prefs.conversationSettings;
    expect(updatedSettings[participant]).toEqual({
      voiceURI: 'Google US English',
      rate: 1.5,
      pitch: 0.8,
    });

    // Set another participant's settings
    const anotherParticipant = 'Cliente';
    useAppStore.getState().setConversationParticipantSetting(anotherParticipant, 'voiceURI', 'Google UK English Female');
    updatedSettings = useAppStore.getState().prefs.conversationSettings;
    expect(updatedSettings[anotherParticipant]).toEqual({
      voiceURI: 'Google UK English Female',
      rate: 1,
      pitch: 1,
    });
  });

  it('should handle non-existent participants gracefully', () => {
    const participant = 'NonExistent';
    useAppStore.getState().setConversationParticipantSetting(participant, 'rate', 1.2);
    const updatedSettings = useAppStore.getState().prefs.conversationSettings;
    expect(updatedSettings[participant]).toEqual({
      voiceURI: '',
      rate: 1.2,
      pitch: 1,
    });
  });
});
