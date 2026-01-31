import { vi, expect, describe, it, beforeEach, beforeAll } from 'vitest';
import { render } from '@testing-library/react';
import Frases from './Frases';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

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

(globalThis as any).SpeechSynthesisUtterance = function (text: string) {
  this.text = text;
  this.lang = '';
  this.rate = 1;
  this.pitch = 1;
  this.voice = null;
  this.onend = null;
  this.onerror = null;
};

(globalThis as any).speechSynthesis = {
  speak: vi.fn(),
  cancel: vi.fn(),
  getVoices: () => [{ voiceURI: 'test', name: 'Test', lang: 'en-US' }],
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
} as any;

// Mock fetch para evitar errores de carga de JSON
beforeAll(() => {
  (globalThis as any).fetch = vi.fn(() => Promise.resolve({
    ok: true,
    json: () => Promise.resolve([]),
  })) as any;

  // Mock indexedDB y constructores requeridos por idb
  (globalThis as any).indexedDB = {
    open: vi.fn(() => ({
      addEventListener: vi.fn(),
      result: {},
      onsuccess: null,
      onerror: null,
      onupgradeneeded: null,
    })),
    deleteDatabase: vi.fn(),
  };
  (globalThis as any).IDBRequest = function () { };
  (globalThis as any).IDBDatabase = function () { };
  (globalThis as any).IDBObjectStore = function () { };
  (globalThis as any).IDBTransaction = function () { };
  (globalThis as any).IDBCursor = function () { };
  (globalThis as any).IDBIndex = function () { };
  (globalThis as any).IDBKeyRange = {
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
    expect((globalThis as any).speechSynthesis.cancel).toHaveBeenCalled();
  });
});
