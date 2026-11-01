/**
 * Factory del Web Worker del motor LLM on-device.
 * Aislada en su propio módulo para no interferir con `workerFactory.ts`
 * (usado por la búsqueda), y para facilitar el mock en tests.
 */
export function createLLMWorker(): Worker {
  return new Worker(new URL('@/workers/llm.worker.ts', import.meta.url), { type: 'module' });
}