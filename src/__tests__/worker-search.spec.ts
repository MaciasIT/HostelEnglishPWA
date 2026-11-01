import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useWorkerSearch } from '@/hooks/useWorkerSearch';
import type { Phrase } from '@/workers/searchWorker';

const mockPhrases: Phrase[] = [
  { id: '1', es: 'Hola', en: 'Hello', eu: 'Kaixo', categoria: 'Saludos' },
  { id: '2', es: 'Adiós', en: 'Goodbye', eu: 'Agur', categoria: 'Saludos' },
  { id: '3', es: 'Gracias', en: 'Thank you', categoria: 'General' },
  { id: '4', es: 'Por favor', en: 'Please', categoria: 'General' },
  { id: '5', es: 'La cuenta, por favor', en: 'The bill, please', categoria: 'Restaurante' },
];

const mockProgress: Record<string, number> = {
  '1': 2,
  '2': 1,
  '3': 3,
  '4': 0,
};

const emptyPhrases: Phrase[] = [];
const emptyProgress: Record<string, number> = {};

describe('useWorkerSearch', () => {
  beforeEach(() => {
    vi.stubGlobal('Worker', undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllTimers();
  });

  it('debería inicializarse vacío sin frases', async () => {
    const { result } = renderHook(() =>
      useWorkerSearch({ phrases: emptyPhrases, progress: emptyProgress })
    );

    await waitFor(() => expect(result.current.metrics?.totalPhrases).toBe(0), { timeout: 1000 });
    expect(result.current.results).toEqual([]);
    expect(result.current.isSearching).toBe(false);
  });

  it('debería calcular métricas de retención correctamente', async () => {
    const { result } = renderHook(() =>
      useWorkerSearch({ phrases: mockPhrases, progress: mockProgress })
    );

    await waitFor(() => expect(result.current.metrics?.totalPhrases).toBe(5), { timeout: 1000 });
    // phrase 4 (id 4) y phrase 5 (sin progreso) → nivel 0
    expect(result.current.metrics?.retentionDistribution[0]).toBe(2);
    // phrase 2 → nivel 1
    expect(result.current.metrics?.retentionDistribution[1]).toBe(1);
    // phrase 1 → nivel 2
    expect(result.current.metrics?.retentionDistribution[2]).toBe(1);
    // phrase 3 → nivel 3
    expect(result.current.metrics?.retentionDistribution[3]).toBe(1);
    // avg = (2 + 1 + 3 + 0 + 0) / 5 = 1.2
    expect(result.current.metrics?.avgRetention).toBeCloseTo(1.2, 5);
  });

  it('debería buscar en español y devolver resultados', async () => {
    const { result } = renderHook(() =>
      useWorkerSearch({ phrases: mockPhrases, progress: mockProgress, debounceMs: 10 })
    );

    act(() => {
      result.current.search('Hola');
    });

    await waitFor(() => expect(result.current.isSearching).toBe(false), { timeout: 1000 });

    expect(result.current.results.length).toBeGreaterThan(0);
    expect(result.current.results.some((r) => r.es === 'Hola')).toBe(true);
  });

  it('debería buscar en inglés y devolver resultados', async () => {
    const { result } = renderHook(() =>
      useWorkerSearch({ phrases: mockPhrases, progress: mockProgress, debounceMs: 10 })
    );

    act(() => {
      result.current.search('Goodbye');
    });

    await waitFor(() => expect(result.current.isSearching).toBe(false), { timeout: 1000 });

    expect(result.current.results.some((r) => r.en === 'Goodbye')).toBe(true);
  });

  it('debería filtrar por categoría', async () => {
    const { result } = renderHook(() =>
      useWorkerSearch({ phrases: mockPhrases, progress: mockProgress, debounceMs: 10 })
    );

    act(() => {
      result.current.search('', 'Saludos');
    });

    await waitFor(() => expect(result.current.isSearching).toBe(false), { timeout: 1000 });

    expect(result.current.results.every((r) => r.categoria === 'Saludos')).toBe(true);
    expect(result.current.results.length).toBe(2);
  });

  it('debería incluir métricas de retención en los resultados', async () => {
    const { result } = renderHook(() =>
      useWorkerSearch({ phrases: mockPhrases, progress: mockProgress, debounceMs: 10 })
    );

    act(() => {
      result.current.search('Hola');
    });

    await waitFor(() => expect(result.current.isSearching).toBe(false), { timeout: 1000 });

    const holaResult = result.current.results.find((r) => r.es === 'Hola');
    expect(holaResult).toBeDefined();
    expect(holaResult!.masteryLevel).toBe(2);
    expect(holaResult!.retentionLabel).toBe('Aprendida');
  });

  it('debería resetear los resultados', async () => {
    const { result } = renderHook(() =>
      useWorkerSearch({ phrases: mockPhrases, progress: mockProgress, debounceMs: 10 })
    );

    act(() => {
      result.current.search('Hola');
    });

    await waitFor(() => expect(result.current.isSearching).toBe(false), { timeout: 1000 });

    expect(result.current.results.length).toBeGreaterThan(0);

    act(() => {
      result.current.reset();
    });

    expect(result.current.results).toEqual([]);
    expect(result.current.isSearching).toBe(false);
  });

  it('debería devolver vacío cuando no hay coincidencias', async () => {
    const { result } = renderHook(() =>
      useWorkerSearch({ phrases: mockPhrases, progress: mockProgress, debounceMs: 10 })
    );

    act(() => {
      result.current.search('zzzzzz');
    });

    await waitFor(() => expect(result.current.isSearching).toBe(false), { timeout: 1000 });

    expect(result.current.results).toEqual([]);
  });

  it('debería ordenar resultados por relevancia', async () => {
    const { result } = renderHook(() =>
      useWorkerSearch({ phrases: mockPhrases, progress: mockProgress, debounceMs: 10 })
    );

    act(() => {
      result.current.search('por favor');
    });

    await waitFor(() => expect(result.current.isSearching).toBe(false), { timeout: 1000 });

    expect(result.current.results.length).toBeGreaterThan(0);
    for (let i = 1; i < result.current.results.length; i++) {
      expect(result.current.results[i - 1].score).toBeGreaterThanOrEqual(
        result.current.results[i].score
      );
    }
  });
});
