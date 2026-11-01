import { useEffect, useRef } from 'react';

export type WaveformState = 'idle' | 'listening' | 'playing' | 'recording' | 'processing' | 'result' | 'error';

export interface AudioWaveformProps {
  state: WaveformState;
  /** MediaStream existente (micrófono). Si state='recording' y no se pasa, se solicita el micrófono. */
  stream?: MediaStream | null;
  /** Elemento <audio>/<video> cuya salida se analiza en state='playing'. */
  mediaElement?: HTMLMediaElement | null;
  bars?: number;
  height?: number;
  className?: string;
  ariaLabel?: string;
}

const LABELS: Record<WaveformState, string> = {
  idle: 'Audio en reposo',
  listening: 'Escuchando',
  playing: 'Reproduciendo audio',
  recording: 'Grabando tu voz',
  processing: 'Analizando audio',
  result: 'Resultado del audio',
  error: 'Error de audio',
};

type AudioCtxCtor = typeof AudioContext;
const getAudioContextCtor = (): AudioCtxCtor | undefined =>
  typeof window === 'undefined'
    ? undefined
    : window.AudioContext ?? (window as unknown as { webkitAudioContext?: AudioCtxCtor }).webkitAudioContext;

const cssColor = (el: Element, name: string, fallback: string) => {
  const v = getComputedStyle(el).getPropertyValue(name).trim();
  return v || fallback;
};

/**
 * Waveform ligero en Canvas. Lee frecuencias con AnalyserNode cuando hay una fuente real
 * (micrófono o elemento multimedia); con speechSynthesis (no enrutable a Web Audio)
 * usa una animación sintética con el mismo aspecto.
 */
export default function AudioWaveform({
  state,
  stream = null,
  mediaElement = null,
  bars = 32,
  height = 64,
  className = '',
  ariaLabel,
}: AudioWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx2d = canvas.getContext('2d');
    if (!ctx2d) return;

    let disposed = false;
    let raf = 0;
    let audioCtx: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let source: MediaStreamAudioSourceNode | MediaElementAudioSourceNode | null = null;
    let ownedStream: MediaStream | null = null;
    let data: Uint8Array<ArrayBuffer> | null = null;
    const levels = new Array<number>(bars).fill(0);

    const reduceMotion =
      typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth || 300;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const accent = cssColor(canvas, '--color-accent', '#e67e22');
    const success = cssColor(canvas, '--color-success', '#2ecc71');
    const danger = cssColor(canvas, '--color-danger', '#e74c3c');
    const color = state === 'result' ? success : state === 'error' ? danger : accent;

    const cleanup = () => {
      cancelAnimationFrame(raf);
      try { source?.disconnect(); } catch { /* noop */ }
      try { analyser?.disconnect(); } catch { /* noop */ }
      ownedStream?.getTracks().forEach((t) => t.stop());
      if (audioCtx && audioCtx.state !== 'closed') void audioCtx.close().catch(() => undefined);
      source = null; analyser = null; audioCtx = null; ownedStream = null;
    };

    const setupAnalyser = (
      node: (c: AudioContext) => MediaStreamAudioSourceNode | MediaElementAudioSourceNode,
      toDestination: boolean,
    ) => {
      const Ctor = getAudioContextCtor();
      if (!Ctor) return;
      audioCtx = new Ctor();
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.8;
      data = new Uint8Array(analyser.frequencyBinCount);
      source = node(audioCtx);
      source.connect(analyser);
      if (toDestination) analyser.connect(audioCtx.destination);
    };

    const drawBars = (values: number[]) => {
      const w = canvas.clientWidth || 300;
      ctx2d.clearRect(0, 0, w, height);
      const gap = 3;
      const bw = Math.max(2, (w - gap * (bars - 1)) / bars);
      ctx2d.fillStyle = color;
      for (let i = 0; i < bars; i++) {
        const h = Math.max(3, values[i] * height);
        const x = i * (bw + gap);
        ctx2d.globalAlpha = 0.35 + values[i] * 0.65;
        ctx2d.beginPath();
        if (typeof ctx2d.roundRect === 'function') ctx2d.roundRect(x, (height - h) / 2, bw, h, bw / 2);
        else ctx2d.rect(x, (height - h) / 2, bw, h);
        ctx2d.fill();
      }
      ctx2d.globalAlpha = 1;
    };

    const target = (i: number, t: number): number => {
      const phase = i / bars;
      switch (state) {
        case 'playing':
        case 'listening':
        case 'recording':
          return 0.15 + 0.45 * Math.abs(Math.sin(t / 180 + i * 0.7) * Math.sin(t / 430 + i * 0.3));
        case 'processing': {
          const d = Math.abs(((t / 900) % 1) - phase);
          return 0.1 + 0.5 * Math.max(0, 1 - Math.min(d, 1 - d) * 6);
        }
        case 'result':
          return 0.12 + 0.12 * Math.sin(phase * Math.PI);
        case 'error':
          return 0.08 + (reduceMotion ? 0 : 0.03 * (1 + Math.sin(t / 1400 + i * 0.5)));
        default:
          return 0.06 + (reduceMotion ? 0 : 0.04 * (1 + Math.sin(t / 900 + i * 0.4)));
      }
    };

    const loop = (t: number) => {
      if (disposed) return;
      raf = requestAnimationFrame(loop);
      if (typeof document !== 'undefined' && document.hidden) return;
      if (analyser && data) {
        analyser.getByteFrequencyData(data);
        const step = Math.max(1, Math.floor(data.length / bars));
        for (let i = 0; i < bars; i++) {
          const idx = Math.min(data.length - 1, Math.abs(i - Math.floor(bars / 2)) * step);
          levels[i] += (data[idx] / 255 - levels[i]) * 0.4;
        }
      } else {
        for (let i = 0; i < bars; i++) {
          const goal = reduceMotion && state !== 'idle' ? 0.2 : target(i, t);
          levels[i] += (goal - levels[i]) * 0.2;
        }
      }
      drawBars(levels);
    };

    const start = async () => {
      try {
        if (state === 'recording' || state === 'listening') {
          let s = stream;
          if (!s && state === 'recording' && navigator.mediaDevices?.getUserMedia) {
            s = await navigator.mediaDevices.getUserMedia({ audio: true });
            if (disposed) { s.getTracks().forEach((tr) => tr.stop()); return; }
            ownedStream = s;
          }
          if (s && !disposed) setupAnalyser((c) => c.createMediaStreamSource(s as MediaStream), false);
        } else if (state === 'playing' && mediaElement) {
          setupAnalyser((c) => c.createMediaElementSource(mediaElement), true);
        }
      } catch {
        // Permiso denegado o API no disponible: animación sintética.
      }
      if (!disposed) raf = requestAnimationFrame(loop);
    };

    void start();
    window.addEventListener('resize', resize);

    return () => {
      disposed = true;
      window.removeEventListener('resize', resize);
      cleanup();
    };
  }, [state, stream, mediaElement, bars, height]);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={ariaLabel ?? LABELS[state]}
      data-state={state}
      className={`w-full block ${className}`}
      style={{ height }}
    />
  );
}
