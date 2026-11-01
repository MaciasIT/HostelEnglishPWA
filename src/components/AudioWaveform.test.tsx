import { render, cleanup, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import AudioWaveform from './AudioWaveform';

const ctx2d = {
  clearRect: vi.fn(), beginPath: vi.fn(), fill: vi.fn(), rect: vi.fn(), roundRect: vi.fn(),
  setTransform: vi.fn(), fillStyle: '', globalAlpha: 1,
};

const created: any[] = [];
class MockAudioContext {
  state = 'running';
  destination = {};
  analyser = {
    fftSize: 0, smoothingTimeConstant: 0, frequencyBinCount: 64,
    getByteFrequencyData: vi.fn((a: Uint8Array) => a.fill(128)),
    connect: vi.fn(), disconnect: vi.fn(),
  };
  source = { connect: vi.fn(), disconnect: vi.fn() };
  close = vi.fn().mockImplementation(async () => { this.state = 'closed'; });
  createAnalyser = vi.fn(() => this.analyser);
  createMediaStreamSource = vi.fn(() => this.source);
  createMediaElementSource = vi.fn(() => this.source);
  constructor() { created.push(this); }
}

const flush = () => act(async () => { await Promise.resolve(); await Promise.resolve(); });

describe('<AudioWaveform />', () => {
  beforeEach(() => {
    created.length = 0;
    vi.stubGlobal('AudioContext', MockAudioContext);
    (window as any).AudioContext = MockAudioContext;
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx2d as any);
    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1));
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
  });
  afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

  it('renderiza con rol img y etiqueta por estado', () => {
    const { getByRole } = render(<AudioWaveform state="processing" />);
    expect(getByRole('img')).toHaveAttribute('aria-label', 'Analizando audio');
    expect(getByRole('img')).toHaveAttribute('data-state', 'processing');
  });

  it('expone el estado de error con su etiqueta accesible', () => {
    const { getByRole } = render(<AudioWaveform state="error" />);
    expect(getByRole('img')).toHaveAttribute('aria-label', 'Error de audio');
    expect(getByRole('img')).toHaveAttribute('data-state', 'error');
  });

  it('idle no crea AudioContext', async () => {
    render(<AudioWaveform state="idle" />);
    await flush();
    expect(created).toHaveLength(0);
  });

  it('recording con stream conecta AnalyserNode y cierra el contexto al desmontar', async () => {
    const stop = vi.fn();
    const stream = { getTracks: () => [{ stop }] } as unknown as MediaStream;
    const { unmount } = render(<AudioWaveform state="recording" stream={stream} />);
    await flush();
    expect(created).toHaveLength(1);
    const c = created[0];
    expect(c.createMediaStreamSource).toHaveBeenCalledWith(stream);
    expect(c.source.connect).toHaveBeenCalledWith(c.analyser);
    unmount();
    expect(c.source.disconnect).toHaveBeenCalled();
    expect(c.close).toHaveBeenCalledTimes(1);
    expect(stop).not.toHaveBeenCalled();
  });

  it('recording sin stream pide micrófono y detiene pistas al desmontar', async () => {
    const stop = vi.fn();
    const stream = { getTracks: () => [{ stop }] } as unknown as MediaStream;
    const getUserMedia = vi.fn().mockResolvedValue(stream);
    Object.defineProperty(navigator, 'mediaDevices', { value: { getUserMedia }, configurable: true });
    const { unmount } = render(<AudioWaveform state="recording" />);
    await flush();
    expect(getUserMedia).toHaveBeenCalledWith({ audio: true });
    unmount();
    expect(stop).toHaveBeenCalled();
    expect(created[0].close).toHaveBeenCalled();
  });

  it('permiso de micrófono denegado: no lanza y no crea contexto', async () => {
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: vi.fn().mockRejectedValue(new Error('denied')) },
      configurable: true,
    });
    const { unmount } = render(<AudioWaveform state="recording" />);
    await flush();
    expect(created).toHaveLength(0);
    unmount();
  });

  it('playing con mediaElement usa createMediaElementSource y enruta a destination', async () => {
    const el = document.createElement('audio');
    const { unmount } = render(<AudioWaveform state="playing" mediaElement={el} />);
    await flush();
    const c = created[0];
    expect(c.createMediaElementSource).toHaveBeenCalledWith(el);
    expect(c.analyser.connect).toHaveBeenCalledWith(c.destination);
    unmount();
    expect(c.close).toHaveBeenCalled();
  });

  it('cambiar de estado cierra el contexto anterior', async () => {
    const stream = { getTracks: () => [] } as unknown as MediaStream;
    const { rerender } = render(<AudioWaveform state="recording" stream={stream} />);
    await flush();
    rerender(<AudioWaveform state="processing" stream={stream} />);
    expect(created[0].close).toHaveBeenCalled();
    expect(created).toHaveLength(1);
  });
});
