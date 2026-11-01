/**
 * Declaración de tipos laxa para `onnxruntime-web`.
 *
 * El paquete expone tipos propios, pero nuestro `import('onnxruntime-web')`
 * resuelve (vía el campo `exports` del paquete y el bundler) al bundle
 * minificado `dist/ort.bundle.min.mjs`, que no tiene un `.d.ts` adyacente.
 * Declaramos solo la superficie que usa `piperRuntime.ts` para que el dynamic
 * import y el cast `as OrtModule` compilen sin arrastrar los tipos internos.
 */
declare module 'onnxruntime-web' {
  export const env: {
    allowLocalModels: boolean;
    wasm: { numThreads: number };
  };
  export const InferenceSession: {
    create(buffer: Uint8Array, options?: Record<string, unknown>): Promise<unknown>;
  };
  export class Tensor {
    constructor(type: string, data: unknown, dims?: number[]);
  }
}