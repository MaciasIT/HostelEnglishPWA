/**
 * Factory del Web Worker de ASR (Whisper / Transformers.js).
 *
 * Aislada en su propio módulo para no interferir con `workerFactory.ts`
 * (búsqueda) ni `llmWorkerFactory.ts` (roleplay), y para permitir el mock
 * en tests sin instanciar un Worker real en JSDOM.
 */
export function createWhisperWorker(): Worker {
  return new Worker(new URL('@/workers/whisperWorker.ts', import.meta.url), {
    type: 'module',
  });
}