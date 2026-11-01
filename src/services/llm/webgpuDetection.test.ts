import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import {
  isWebGPUSupported,
  detectWebGPU,
  getLLMCapability,
} from './webgpuDetection';

function setGPU(gpu: object | undefined): void {
  if (gpu === undefined) {
    // @ts-expect-error borrado de propiedad en test
    delete navigator.gpu;
  } else {
    Object.defineProperty(navigator, 'gpu', { value: gpu, configurable: true, writable: true });
  }
}

function setDeviceMemory(mem: number | undefined): void {
  if (mem === undefined) {
    // @ts-expect-error borrado de propiedad en test
    delete navigator.deviceMemory;
  } else {
    Object.defineProperty(navigator, 'deviceMemory', { value: mem, configurable: true, writable: true });
  }
}

beforeEach(() => {
  // jsdom no expone Worker: lo simulamos para que getLLMCapability lo detecte.
  vi.stubGlobal('Worker', class FakeWorker {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  setGPU(undefined);
  setDeviceMemory(undefined);
});

describe('isWebGPUSupported', () => {
  it('devuelve false cuando navigator.gpu no existe', () => {
    setGPU(undefined);
    expect(isWebGPUSupported()).toBe(false);
  });

  it('devuelve true cuando navigator.gpu existe', () => {
    setGPU({});
    expect(isWebGPUSupported()).toBe(true);
  });
});

describe('detectWebGPU', () => {
  it('devuelve false sin navigator.gpu', async () => {
    setGPU(undefined);
    await expect(detectWebGPU()).resolves.toBe(false);
  });

  it('devuelve true cuando requestAdapter devuelve un adaptador', async () => {
    setGPU({ requestAdapter: async () => ({}) });
    await expect(detectWebGPU()).resolves.toBe(true);
  });

  it('devuelve false cuando requestAdapter devuelve null', async () => {
    setGPU({ requestAdapter: async () => null });
    await expect(detectWebGPU()).resolves.toBe(false);
  });

  it('devuelve false si requestAdapter lanza', async () => {
    setGPU({ requestAdapter: async () => { throw new Error('no gpu'); } });
    await expect(detectWebGPU()).resolves.toBe(false);
  });
});

describe('getLLMCapability', () => {
  it('marca unsupported y da razón cuando no hay WebGPU', async () => {
    setGPU(undefined);
    const cap = await getLLMCapability();
    expect(cap.supported).toBe(false);
    expect(cap.webgpu).toBe(false);
    expect(cap.reason).toContain('WebGPU');
  });

  it('marca supported con WebGPU, Worker y memoria suficiente', async () => {
    setGPU({ requestAdapter: async () => ({}) });
    setDeviceMemory(8);
    const cap = await getLLMCapability();
    expect(cap.supported).toBe(true);
    expect(cap.deviceMemoryGb).toBe(8);
  });

  it('marca unsupported con RAM inferior a 4 GB', async () => {
    setGPU({ requestAdapter: async () => ({}) });
    setDeviceMemory(2);
    const cap = await getLLMCapability();
    expect(cap.supported).toBe(false);
    expect(cap.reason).toContain('insuficiente');
  });
});