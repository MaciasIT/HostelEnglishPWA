import { describe, it, expect } from 'vitest';
import { detectASRCapability, type ASRCapabilitySource } from './asrCapabilities';

/** `validate` que acepta solo la cabecera mágica (8 bytes), no el módulo SIMD. */
const wasmOnlyValidate = (bytes: Uint8Array): boolean => bytes.length === 8;
const alwaysValidate = (): boolean => true;
const neverValidate = (): boolean => false;

function source(overrides: Partial<ASRCapabilitySource>): ASRCapabilitySource {
  return overrides;
}

describe('detectASRCapability', () => {
  it('declara viable la ruta on-device con Worker + WASM SIMD (sin WebGPU)', () => {
    const cap = detectASRCapability(
      source({ Worker: function Worker() {}, WebAssembly: { validate: alwaysValidate } }),
    );
    expect(cap.worker).toBe(true);
    expect(cap.wasm).toBe(true);
    expect(cap.wasmSimd).toBe(true);
    expect(cap.webgpu).toBe(false);
    expect(cap.supported).toBe(true);
    expect(cap.reason).toBeUndefined();
  });

  it('declara viable con WebGPU aunque no haya WASM SIMD', () => {
    const cap = detectASRCapability(
      source({
        navigator: { gpu: {} },
        Worker: function Worker() {},
        WebAssembly: { validate: wasmOnlyValidate },
      }),
    );
    expect(cap.webgpu).toBe(true);
    expect(cap.wasmSimd).toBe(false);
    expect(cap.supported).toBe(true);
  });

  it('degrada a Web Speech cuando no hay SIMD ni WebGPU', () => {
    const cap = detectASRCapability(
      source({ Worker: function Worker() {}, WebAssembly: { validate: wasmOnlyValidate } }),
    );
    expect(cap.supported).toBe(false);
    expect(cap.reason).toContain('Web Speech');
  });

  it('degrada cuando no hay Web Worker', () => {
    const cap = detectASRCapability(source({ WebAssembly: { validate: alwaysValidate } }));
    expect(cap.worker).toBe(false);
    expect(cap.supported).toBe(false);
    expect(cap.reason).toContain('Web Worker');
  });

  it('degrada cuando WebAssembly no está disponible', () => {
    const cap = detectASRCapability(
      source({ Worker: function Worker() {}, WebAssembly: { validate: neverValidate } }),
    );
    expect(cap.wasm).toBe(false);
    expect(cap.supported).toBe(false);
    expect(cap.reason).toContain('WebAssembly');
  });

  it('no lanza con un entorno totalmente vacío', () => {
    const cap = detectASRCapability(source({}));
    expect(cap.supported).toBe(false);
    expect(cap.reason).toBeDefined();
  });
});