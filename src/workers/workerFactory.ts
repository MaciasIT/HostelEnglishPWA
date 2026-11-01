export function createSearchWorker(): Worker {
  return new Worker(
    new URL('@/workers/searchWorker.ts', import.meta.url),
    { type: 'module' }
  );
}
