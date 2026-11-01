import { describe, it, expect, vi } from 'vitest';

import { AudioManager } from './AudioManager';
import type { AudioEngineAdapter, AudioEngineType, DeviceCapabilities, PlaybackState } from './types';

function caps(overrides: Partial<DeviceCapabilities> = {}): DeviceCapabilities {
  return {
    webgpu: true,
    webAudio: true,
    speechSynthesis: true,
    secureContext: true,
    deviceMemoryGB: 8,
    hardwareConcurrency: 8,
    online: true,
    ...overrides,
  };
}

function fakeEngine(type: AudioEngineType, available = true): AudioEngineAdapter {
  return {
    type,
    isAvailable: vi.fn(async () => available),
    speak: vi.fn(async () => {}),
    cancel: vi.fn(),
    prewarm: vi.fn(async () => {}),
  };
}

describe('AudioManager — selector por capacidades', () => {
  it('selecciona Piper con WebGPU y memoria suficiente', () => {
    const m = new AudioManager({ capabilities: caps({ webgpu: true, deviceMemoryGB: 8 }) });
    expect(m.getSelectedEngine()).toBe('piper');
  });

  it('selecciona Cloud con red y cloud habilitado', () => {
    const m = new AudioManager({
      capabilities: caps({ webgpu: false, online: true }),
      preferences: { cloudEnabled: true },
    });
    expect(m.getSelectedEngine()).toBe('cloud');
  });

  it('selecciona Web Speech como último recurso', () => {
    expect(
      new AudioManager({ capabilities: caps({ webgpu: false }), preferences: { cloudEnabled: false } })
        .getSelectedEngine(),
    ).toBe('web-speech');
    expect(
      new AudioManager({ capabilities: caps({ webgpu: false, online: false }), preferences: { cloudEnabled: true } })
        .getSelectedEngine(),
    ).toBe('web-speech');
    expect(
      new AudioManager({ capabilities: caps({ webgpu: true, deviceMemoryGB: 2 }) }).getSelectedEngine(),
    ).toBe('web-speech');
  });
});

describe('AudioManager — degradación escalonada (cero fallos silenciosos)', () => {
  it('usa Piper y no degrada cuando funciona', async () => {
    const piper = fakeEngine('piper');
    const cloud = fakeEngine('cloud');
    const ws = fakeEngine('web-speech');
    const m = new AudioManager({ capabilities: caps(), engines: [piper, cloud, ws] });

    const res = await m.speak('hello');
    expect(res.ok).toBe(true);
    expect(res.engine).toBe('piper');
    expect(piper.speak).toHaveBeenCalledWith('hello', {});
    expect(cloud.speak).not.toHaveBeenCalled();
    expect(ws.speak).not.toHaveBeenCalled();
  });

  it('degradar a cloud cuando Piper falla', async () => {
    const piper = fakeEngine('piper');
    vi.mocked(piper.speak).mockRejectedValue(new Error('piper down'));
    const cloud = fakeEngine('cloud');
    const ws = fakeEngine('web-speech');
    const m = new AudioManager({
      capabilities: caps(),
      engines: [piper, cloud, ws],
      preferences: { cloudEnabled: true },
    });

    const res = await m.speak('hello');
    expect(res.ok).toBe(true);
    expect(res.engine).toBe('cloud');
    expect(piper.speak).toHaveBeenCalled();
    expect(cloud.speak).toHaveBeenCalled();
    expect(ws.speak).not.toHaveBeenCalled();
  });

  it('conmuta a Web Speech cuando Piper y cloud fallan', async () => {
    const piper = fakeEngine('piper');
    vi.mocked(piper.speak).mockRejectedValue(new Error('piper down'));
    const cloud = fakeEngine('cloud');
    vi.mocked(cloud.speak).mockRejectedValue(new Error('cloud down'));
    const ws = fakeEngine('web-speech');
    const m = new AudioManager({
      capabilities: caps(),
      engines: [piper, cloud, ws],
      preferences: { cloudEnabled: true },
    });

    const res = await m.speak('hello');
    expect(res.ok).toBe(true);
    expect(res.engine).toBe('web-speech');
    expect(ws.speak).toHaveBeenCalledWith('hello', {});
    expect(res.attempted).toEqual(['piper', 'cloud', 'web-speech']);
  });

  it('omite motores no disponibles y pasa al siguiente', async () => {
    const piper = fakeEngine('piper', false);
    const cloud = fakeEngine('cloud');
    const m = new AudioManager({
      capabilities: caps(),
      engines: [piper, cloud],
      preferences: { cloudEnabled: true },
    });

    const res = await m.speak('hello');
    expect(res.engine).toBe('cloud');
    expect(piper.speak).not.toHaveBeenCalled();
    expect(cloud.speak).toHaveBeenCalled();
  });

  it('reporta error (no silencioso) cuando ningún motor funciona', async () => {
    const engines = (['piper', 'cloud', 'web-speech'] as const).map((t) => {
      const e = fakeEngine(t);
      vi.mocked(e.speak).mockRejectedValue(new Error(`${t} down`));
      return e;
    });
    const m = new AudioManager({
      capabilities: caps(),
      engines,
      preferences: { cloudEnabled: true },
    });
    const states: PlaybackState[] = [];
    m.subscribe((s) => states.push(s));

    const res = await m.speak('hello');
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/web-speech down/);
    expect(m.getState()).toBe('error');
    expect(states).toContain('error');
  });
});

describe('AudioManager — conmutación automática a voz euskera (FC-09)', () => {
  it('inyecta la voz Piper euskaldun por defecto al reproducir euskera', async () => {
    const piper = fakeEngine('piper');
    const m = new AudioManager({ capabilities: caps(), engines: [piper] });

    await m.speak('kaixo', { language: 'eu' });

    expect(piper.speak).toHaveBeenCalledWith('kaixo', { language: 'eu', voice: 'eu_ES-antton-medium' });
    expect(piper.isAvailable).toHaveBeenCalledWith(expect.anything(), 'eu');
  });

  it('no modifica las opciones para idiomas sin voz Piper', async () => {
    const piper = fakeEngine('piper');
    const m = new AudioManager({ capabilities: caps(), engines: [piper] });

    await m.speak('hello', { language: 'en' });

    expect(piper.speak).toHaveBeenCalledWith('hello', { language: 'en' });
  });

  it('respeta una voz explícita proporcionada por el llamante', async () => {
    const piper = fakeEngine('piper');
    const m = new AudioManager({ capabilities: caps(), engines: [piper] });

    await m.speak('kaixo', { language: 'eu', voice: 'maider' });

    expect(piper.speak).toHaveBeenCalledWith('kaixo', { language: 'eu', voice: 'maider' });
  });
});

describe('AudioManager — estados y ciclo de vida', () => {
  it('emite loading/playing y vuelve a idle tras reproducir', async () => {
    const piper = fakeEngine('piper');
    const m = new AudioManager({ capabilities: caps(), engines: [piper] });
    const states: PlaybackState[] = [];
    m.subscribe((s) => states.push(s));

    await m.speak('hi');
    expect(states.indexOf('loading')).toBeGreaterThan(-1);
    expect(states.indexOf('playing')).toBeGreaterThan(-1);
    expect(m.getState()).toBe('idle');
  });

  it('texto vacío no intenta motores', async () => {
    const ws = fakeEngine('web-speech');
    const m = new AudioManager({ capabilities: caps({ webgpu: false }), engines: [ws] });

    const res = await m.speak('   ');
    expect(res.ok).toBe(false);
    expect(ws.speak).not.toHaveBeenCalled();
  });

  it('cancel() interrumpe la reproducción y vuelve a idle', async () => {
    let release: (() => void) | undefined;
    const piper = fakeEngine('piper');
    vi.mocked(piper.speak).mockImplementation(
      () => new Promise<void>((resolve) => { release = resolve; }),
    );
    const m = new AudioManager({ capabilities: caps(), engines: [piper] });

    const pending = m.speak('hola');
    await vi.waitFor(() => expect(m.getState()).toBe('playing'));

    m.cancel();
    expect(m.getState()).toBe('idle');

    release!();
    const res = await pending;
    expect(res.ok).toBe(false);
  });

  it('subscribe devuelve una función de desuscripción', () => {
    const m = new AudioManager({ capabilities: caps(), engines: [fakeEngine('piper')] });
    const listener = vi.fn();
    const off = m.subscribe(listener);
    expect(listener).toHaveBeenCalledWith('idle');
    off();
    m.cancel();
    // cancel de idle a idle no emite; forzamos un cambio de estado visible.
    expect(listener).toHaveBeenCalledTimes(1);
  });
});