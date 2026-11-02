import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  MAX_DURATION_SECONDS,
  MAX_SAMPLES,
  deleteSample,
  listSamples,
  sampleFileName,
  sampleToBlob,
  saveSample,
  type VoiceSample,
} from '@/services/portfolio/voicePortfolio';

const pickMime = (): string => {
  const MR = (globalThis as { MediaRecorder?: typeof MediaRecorder }).MediaRecorder;
  if (!MR?.isTypeSupported) return 'audio/webm';
  return ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus'].find((m) => MR.isTypeSupported(m)) ?? 'audio/webm';
};

const VoicePortfolio: React.FC = () => {
  const [samples, setSamples] = useState<VoiceSample[]>([]);
  const [urls, setUrls] = useState<Record<number, string>>({});
  const [recordingSlot, setRecordingSlot] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const recorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(async () => {
    try {
      const list = await listSamples();
      setSamples(list);
      setUrls((prev) => {
        Object.values(prev).forEach((u) => URL.revokeObjectURL?.(u));
        return Object.fromEntries(list.map((s) => [s.slot, URL.createObjectURL(sampleToBlob(s))]));
      });
    } catch {
      setMessage('No se pudo acceder al almacenamiento local.');
    }
  }, []);

  useEffect(() => {
    void refresh();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      recorderRef.current?.stream?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startRecording = async (slot: number) => {
    setMessage('');
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setMessage('Tu navegador no permite grabar audio.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = pickMime();
      const rec = new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 24000 });
      const chunks: Blob[] = [];
      const t0 = Date.now();
      rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        if (timerRef.current) clearTimeout(timerRef.current);
        setRecordingSlot(null);
        const seconds = Math.min(MAX_DURATION_SECONDS, (Date.now() - t0) / 1000);
        try {
          await saveSample(slot, new Blob(chunks, { type: mimeType.split(';')[0] }), seconds);
          setMessage(`Muestra ${slot + 1} guardada.`);
          await refresh();
        } catch (e) {
          setMessage(e instanceof Error ? e.message : 'No se pudo guardar la muestra.');
        }
      };
      recorderRef.current = rec;
      rec.start();
      setRecordingSlot(slot);
      timerRef.current = setTimeout(() => rec.state !== 'inactive' && rec.stop(), MAX_DURATION_SECONDS * 1000);
    } catch {
      setMessage('No se pudo acceder al micrófono. Revisa los permisos.');
    }
  };

  const stopRecording = () => {
    const rec = recorderRef.current;
    if (rec && rec.state !== 'inactive') rec.stop();
  };

  const remove = async (slot: number) => {
    await deleteSample(slot);
    setMessage(`Muestra ${slot + 1} eliminada.`);
    await refresh();
  };

  const exportSample = (s: VoiceSample) => {
    const url = URL.createObjectURL(sampleToBlob(s));
    const a = document.createElement('a');
    a.href = url;
    a.download = sampleFileName(s);
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL?.(url), 1000);
  };

  const slots = Array.from({ length: MAX_SAMPLES }, (_, i) => i);

  return (
    <section
      className="bg-surface/5 p-4 sm:p-10 rounded-2xl sm:rounded-[3rem] border border-border/10 shadow-2xl"
      aria-labelledby="voice-portfolio-heading"
      data-testid="voice-portfolio"
    >
      <h2 id="voice-portfolio-heading" className="text-xl sm:text-2xl font-black text-primary tracking-tight mb-2">
        Portafolio de Voz
      </h2>
      <p className="text-tertiary text-sm mb-6">
        Guarda hasta {MAX_SAMPLES} muestras de {MAX_DURATION_SECONDS} s. Se almacenan solo en tu dispositivo.
      </p>
      <div role="status" aria-live="polite" className="text-sm text-secondary mb-4 min-h-5">{message}</div>
      <ul className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {slots.map((slot) => {
          const s = samples.find((x) => x.slot === slot);
          const recording = recordingSlot === slot;
          return (
            <li key={slot} className="p-4 rounded-2xl border border-border/10 space-y-3" data-testid={`voice-slot-${slot}`}>
              <h3 className="font-bold text-primary">Muestra {slot + 1}</h3>
              {s ? (
                <>
                  <audio controls src={urls[slot]} aria-label={`Reproducir muestra de voz ${slot + 1}`} className="w-full" />
                  <p className="text-xs text-tertiary">
                    {s.durationSeconds.toFixed(1)} s · {(s.sizeBytes / 1024).toFixed(0)} KB
                  </p>
                </>
              ) : (
                <p className="text-sm text-tertiary">Sin grabar</p>
              )}
              <div className="flex flex-wrap gap-2">
                {recording ? (
                  <button type="button" onClick={stopRecording} className="px-3 py-2 rounded-xl bg-red-600 text-white text-sm font-bold">
                    Detener grabación
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => void startRecording(slot)}
                    disabled={recordingSlot !== null}
                    className="px-3 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold disabled:opacity-50"
                  >
                    {s ? 'Volver a grabar' : 'Grabar'}
                  </button>
                )}
                {s && (
                  <>
                    <button type="button" onClick={() => exportSample(s)} className="px-3 py-2 rounded-xl border border-border/20 text-primary text-sm font-bold">
                      Exportar
                    </button>
                    <button type="button" onClick={() => void remove(slot)} className="px-3 py-2 rounded-xl border border-border/20 text-primary text-sm font-bold">
                      Eliminar
                    </button>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default VoicePortfolio;
