import { describe, it, expect, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

import { AudioManager } from '@/services/audio/AudioManager';
import type { AudioEngineAdapter, DeviceCapabilities, PlaybackState } from '@/services/audio/types';

import { mapPlaybackToWaveform, useAudioManager } from './useAudioManager';

const caps: DeviceCapabilities = {
  webgpu: false,
  webAudio: false,
  speechSynthesis: true,
  secureContext: true,
  deviceMemoryGB: null,
  hardwareConcurrency: 2,
  online: true,
};

function fakeEngine(): AudioEngineAdapter {
  return {
    type: 'web-speech',
    isAvailable: vi.fn(async () => true),
    speak: vi.fn(async () => {}),
    cancel: vi.fn(),
    prewarm: vi.fn(async () => {}),
  };
}

describe('mapPlaybackToWaveform', () => {
  it('mapea cada estado de reproducción al estado visual', () => {
    expect(mapPlaybackToWaveform('idle')).toBe('idle');
    expect(mapPlaybackToWaveform('loading')).toBe('processing');
    expect(mapPlaybackToWaveform('playing')).toBe('playing');
    expect(mapPlaybackToWaveform('error')).toBe('error');
  });
});

describe('useAudioManager', () => {
  it('expone speak/cancel/preload, estado y motor', () => {
    const manager = new AudioManager({ capabilities: caps, engines: [fakeEngine()] });
    const { result } = renderHook(() => useAudioManager(manager));

    expect(result.current.status).toBe('idle');
    expect(result.current.waveformState).toBe('idle');
    expect(result.current.engine).toBe('web-speech');
    expect(typeof result.current.speak).toBe('function');
    expect(typeof result.current.cancel).toBe('function');
    expect(typeof result.current.preload).toBe('function');
  });

  it('refleja los cambios de estado del manager tras reproducir', async () => {
    const manager = new AudioManager({ capabilities: caps, engines: [fakeEngine()] });
    const { result } = renderHook(() => useAudioManager(manager));
    const states: PlaybackState[] = [];
    const unsub = manager.subscribe((s) => states.push(s));

    await act(async () => {
      await result.current.speak('hello');
    });

    expect(result.current.status).toBe('idle');
    expect(states).toContain('playing');
    unsub();
  });
});