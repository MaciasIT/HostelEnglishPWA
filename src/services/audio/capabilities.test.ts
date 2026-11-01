import { describe, it, expect } from 'vitest';

import { detectCapabilities, FALLBACK_ORDER, selectEngine } from './capabilities';
import type { CapabilitySource } from './capabilities';
import type { DeviceCapabilities } from './types';

function caps(overrides: Partial<DeviceCapabilities> = {}): DeviceCapabilities {
  return {
    webgpu: false,
    webAudio: true,
    speechSynthesis: true,
    secureContext: true,
    deviceMemoryGB: null,
    hardwareConcurrency: 8,
    online: true,
    ...overrides,
  };
}

function source(overrides: Partial<CapabilitySource> = {}): CapabilitySource {
  return {
    navigator: {},
    window: {},
    ...overrides,
  };
}

describe('detectCapabilities', () => {
  it('detecta WebGPU por presencia de navigator.gpu', () => {
    expect(detectCapabilities(source({ navigator: { gpu: {} } })).webgpu).toBe(true);
    expect(detectCapabilities(source({ navigator: {} })).webgpu).toBe(false);
  });

  it('detecta Web Audio por AudioContext o webkitAudioContext', () => {
    expect(detectCapabilities(source({ window: { AudioContext: {} } })).webAudio).toBe(true);
    expect(detectCapabilities(source({ window: { webkitAudioContext: {} } })).webAudio).toBe(true);
    expect(detectCapabilities(source()).webAudio).toBe(false);
  });

  it('detecta speechSynthesis y contexto seguro', () => {
    const c = detectCapabilities(
      source({ window: { speechSynthesis: {}, isSecureContext: true } }),
    );
    expect(c.speechSynthesis).toBe(true);
    expect(c.secureContext).toBe(true);
  });

  it('lee deviceMemory como entero o null, y hardwareConcurrency con defecto', () => {
    expect(detectCapabilities(source({ navigator: { deviceMemory: 8 } })).deviceMemoryGB).toBe(8);
    expect(detectCapabilities(source()).deviceMemoryGB).toBeNull();
    expect(detectCapabilities(source()).hardwareConcurrency).toBe(2);
    expect(
      detectCapabilities(source({ navigator: { hardwareConcurrency: 6 } })).hardwareConcurrency,
    ).toBe(6);
  });

  it('lee online con defecto true cuando no se expone', () => {
    expect(detectCapabilities(source({ navigator: { onLine: false } })).online).toBe(false);
    expect(detectCapabilities(source()).online).toBe(true);
  });
});

describe('selectEngine', () => {
  it('elige Piper con WebGPU y memoria suficiente', () => {
    expect(selectEngine(caps({ webgpu: true, deviceMemoryGB: 8 }))).toBe('piper');
    expect(selectEngine(caps({ webgpu: true, deviceMemoryGB: null }))).toBe('piper');
  });

  it('no elige Piper con WebGPU pero memoria insuficiente', () => {
    expect(selectEngine(caps({ webgpu: true, deviceMemoryGB: 2 }))).toBe('web-speech');
  });

  it('elige Cloud con red y cloud habilitado', () => {
    expect(selectEngine(caps({ webgpu: false, online: true }), { cloudEnabled: true })).toBe('cloud');
  });

  it('elige Web Speech sin red aunque cloud esté habilitado', () => {
    expect(selectEngine(caps({ webgpu: false, online: false }), { cloudEnabled: true })).toBe('web-speech');
  });

  it('elige Web Speech cuando cloud no está habilitado', () => {
    expect(selectEngine(caps({ webgpu: false, online: true }), { cloudEnabled: false })).toBe('web-speech');
  });

  it('respeta un motor forzado', () => {
    expect(selectEngine(caps({ webgpu: true }), { cloudEnabled: false, forcedEngine: 'cloud' })).toBe('cloud');
  });

  it('expone el orden canónico de degradación', () => {
    expect(FALLBACK_ORDER).toEqual(['piper', 'cloud', 'web-speech']);
  });
});