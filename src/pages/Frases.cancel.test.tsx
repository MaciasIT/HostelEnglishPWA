// Mock completo de idb para evitar errores de indexedDB en tests
vi.mock('idb', () => ({
  openDB: vi.fn(() => Promise.resolve({
    put: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
    objectStoreNames: { contains: vi.fn(() => true) },
    createObjectStore: vi.fn(),
    close: vi.fn(),
    addEventListener: vi.fn(),
  })),
}));
import { vi, expect, describe, it, beforeEach, beforeAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Frases from './Frases';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

(global as any).SpeechSynthesisUtterance = function(text: string) {
  this.text = text;
  this.lang = '';
  this.rate = 1;
  this.pitch = 1;
  this.voice = null;
  this.onend = null;
  this.onerror = null;
};

global.speechSynthesis = {
  speak: vi.fn(),
  cancel: vi.fn(),
  getVoices: () => [{ voiceURI: 'test', name: 'Test', lang: 'en-US' }],
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
} as any;

// Mock fetch para evitar errores de carga de JSON
beforeAll(() => {
  global.fetch = vi.fn(() => Promise.resolve({
    ok: true,
    json: () => Promise.resolve([]),
  })) as any;
  // Mock indexedDB y constructores requeridos por idb
  (global as any).indexedDB = {
    open: vi.fn(() => ({      addEventListener: vi.fn(),
      result: {},
      onsuccess: null,
      onerror: null,
      onupgradeneeded: null,
    })),
    deleteDatabase: vi.fn(),
  };
  (global as any).IDBRequest = function() {};
  (global as any).IDBDatabase = function() {};
  (global as any).IDBObjectStore = function() {};
  (global as any).IDBTransaction = function() {};
  (global as any).IDBCursor = function() {};
  (global as any).IDBIndex = function() {};
  (global as any).IDBKeyRange = {
    only: vi.fn(),
    bound: vi.fn(),
    lowerBound: vi.fn(),
    upperBound: vi.fn(),
  };
});

describe('Frases - Playback Cancellation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('cancels playback on unmount', () => {
    const { unmount } = render(
      <MemoryRouter>
        <Frases />
      </MemoryRouter>
    );
    unmount();
    expect(global.speechSynthesis.cancel).toHaveBeenCalled();
  });
});
