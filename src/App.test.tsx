import { render, screen, cleanup } from '@testing-library/react';
import App from './App';
import '@testing-library/jest-dom';
import { vi, describe, it, expect, afterEach } from 'vitest';
import React from 'react';
import { useAppStore } from '@/store/useAppStore';

// Mock matchMedia for tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

vi.mock('@/store/useAppStore');

describe('App', () => {
  const mockState = {
    toggleSideNav: vi.fn(),
    isSideNavOpen: false,
    closeSideNav: vi.fn(),
    prefs: {
      targetLanguage: 'en',
    },
    frases: [],
    conversations: [],
    frasesLoaded: false,
    conversationsLoaded: false,
    loadFrases: vi.fn(),
    loadConversations: vi.fn(),
  };

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('should render the main application without crashing', () => {
    vi.mocked(useAppStore).mockImplementation((selector: any) => {
      if (typeof selector === 'function') return selector(mockState);
      return mockState;
    });

    render(<App />);
    // screen.debug(); // For local debugging
    // Usamos queryAllByText para mayor flexibilidad
    const elements = screen.queryAllByText(/Hostel/i);
    expect(elements.length).toBeGreaterThan(0);
  });
});
