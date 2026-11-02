import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BackupError,
  QrFrameAssembler,
  backupFileName,
  createBackupPayload,
  parseBackupPayload,
  payloadToBlob,
  planQrFrames,
  qrMatrixM,
  qrToSvgPath,
  readBackupFile,
  restoreState,
  summarizeState,
  type BackupState,
} from '@/services/sync/backupService';

export type TransferMode = 'send' | 'receive';

interface Props {
  mode: TransferMode;
  onClose: () => void;
}

const errMsg = (e: unknown) => (e instanceof BackupError ? e.message : 'No se pudo procesar el respaldo.');

const QrFrameView = ({ text }: { text: string }) => {
  const { size, path } = useMemo(() => {
    const m = qrMatrixM(text);
    return { size: m.length, path: qrToSvgPath(m) };
  }, [text]);
  return (
    <svg
      role="img"
      aria-label="Código QR de transferencia"
      viewBox={`-4 -4 ${size + 8} ${size + 8}`}
      className="w-64 h-64 bg-white rounded-xl"
      shapeRendering="crispEdges"
    >
      <path d={path} fill="#000" />
    </svg>
  );
};

const SendPane = () => {
  const [payload, setPayload] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [frameIdx, setFrameIdx] = useState(0);

  useEffect(() => {
    createBackupPayload().then(setPayload).catch((e) => setError(errMsg(e)));
  }, []);

  const plan = useMemo(() => (payload ? planQrFrames(payload) : null), [payload]);

  useEffect(() => {
    if (plan?.mode !== 'multi') return;
    const id = setInterval(() => setFrameIdx((i) => (i + 1) % plan.frames.length), 900);
    return () => clearInterval(id);
  }, [plan]);

  const download = () => {
    if (!payload) return;
    const url = URL.createObjectURL(payloadToBlob(payload));
    const a = document.createElement('a');
    a.href = url;
    a.download = backupFileName();
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  };

  if (error) return <p role="alert" className="text-red-500 font-bold">{error}</p>;
  if (!plan) return <p className="text-tertiary">Preparando respaldo…</p>;

  return (
    <div className="flex flex-col items-center gap-4">
      {plan.mode !== 'file' && (
        <>
          <QrFrameView text={plan.frames[frameIdx].text} />
          <p className="text-sm text-tertiary text-center" aria-live="polite">
            {plan.mode === 'single'
              ? 'Escanea este QR desde el otro dispositivo (Configuración → Recibir).'
              : `QR dinámico: apunta la cámara del otro dispositivo hasta capturar los ${plan.frames.length} fragmentos (ahora ${frameIdx + 1}/${plan.frames.length}).`}
          </p>
        </>
      )}
      {plan.mode === 'file' && (
        <p className="text-sm text-tertiary text-center">Tu progreso es demasiado grande para QR. Usa el archivo.</p>
      )}
      <button onClick={download} className="px-5 py-3 rounded-xl bg-accent text-primary font-black">
        Descargar archivo .he-backup
      </button>
      <p className="text-xs text-tertiary text-center">Los datos se generan en tu dispositivo y no pasan por ningún servidor.</p>
    </div>
  );
};

type BarcodeDetectorLike = { detect: (src: CanvasImageSource) => Promise<{ rawValue: string }[]> };

const ReceivePane = ({ onDone }: { onDone: () => void }) => {
  const [pending, setPending] = useState<{ state: BackupState; createdAt: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState({ received: 0, total: 0 });
  const [dragging, setDragging] = useState(false);
  const [restored, setRestored] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const assembler = useRef(new QrFrameAssembler());
  const stopRef = useRef<() => void>(() => {});

  const handlePayload = useCallback(async (payload: string) => {
    try {
      setError(null);
      setPending(await parseBackupPayload(payload));
    } catch (e) {
      setError(errMsg(e));
    }
  }, []);

  const handleFile = async (file?: File | null) => {
    if (!file) return;
    try {
      await handlePayload(await readBackupFile(file));
    } catch (e) {
      setError(errMsg(e));
    }
  };

  const feed = useCallback(
    (raw: string) => {
      const asm = assembler.current;
      if (asm.add(raw)) setProgress({ ...asm.progress });
      if (asm.complete) {
        stopRef.current();
        try {
          const payload = asm.assemble();
          handlePayload(payload);
        } catch (e) {
          setError(errMsg(e));
        }
        asm.reset();
      }
    },
    [handlePayload]
  );

  const canScan =
    typeof window !== 'undefined' && 'BarcodeDetector' in window && !!navigator.mediaDevices?.getUserMedia;

  const startScan = async () => {
    try {
      const Detector = (window as unknown as { BarcodeDetector: new (o: object) => BarcodeDetectorLike }).BarcodeDetector;
      const detector = new Detector({ formats: ['qr_code'] });
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      const video = videoRef.current;
      if (!video) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      video.srcObject = stream;
      await video.play();
      setScanning(true);
      let alive = true;
      stopRef.current = () => {
        alive = false;
        stream.getTracks().forEach((t) => t.stop());
        setScanning(false);
      };
      const tick = async () => {
        if (!alive) return;
        try {
          const codes = await detector.detect(video);
          codes.forEach((c) => feed(c.rawValue));
        } catch {
          /* fotograma no legible */
        }
        if (alive) setTimeout(tick, 150);
      };
      tick();
    } catch {
      setError('No se pudo acceder a la cámara. Usa el archivo .he-backup.');
    }
  };

  useEffect(() => () => stopRef.current(), []);

  const confirm = () => {
    if (!pending) return;
    try {
      restoreState(pending.state);
      setRestored(true);
      setPending(null);
    } catch (e) {
      setError(errMsg(e));
    }
  };

  if (restored) {
    return (
      <div className="text-center space-y-4" role="status">
        <p className="text-lg font-black text-primary">✅ Progreso restaurado correctamente.</p>
        <button onClick={onDone} className="px-5 py-3 rounded-xl bg-accent text-primary font-black">Cerrar</button>
      </div>
    );
  }

  if (pending) {
    const s = summarizeState(pending.state);
    return (
      <div className="space-y-4">
        <p className="font-black text-primary">Respaldo válido del {new Date(pending.createdAt).toLocaleString()}</p>
        <ul className="text-sm text-tertiary list-disc pl-5">
          <li>{s.phrasesStudied} frases con progreso</li>
          <li>{s.reviewItems} elementos de repaso</li>
          <li>{s.certifications} certificaciones · {s.achievements} logros</li>
          <li>Licencia Pro: {s.premium ? 'sí' : 'no'}</li>
        </ul>
        <p role="alert" className="text-sm font-bold text-red-500">
          Esto reemplazará todo el progreso actual de este dispositivo.
        </p>
        <div className="flex gap-3">
          <button onClick={confirm} className="flex-1 px-4 py-3 rounded-xl bg-accent text-primary font-black">Restaurar</button>
          <button onClick={() => setPending(null)} className="flex-1 px-4 py-3 rounded-xl border border-border/20 font-bold">Cancelar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <label
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files?.[0]); }}
        className={`block cursor-pointer text-center border-2 border-dashed rounded-2xl p-6 ${dragging ? 'border-accent bg-accent/10' : 'border-border/20'}`}
      >
        <span className="font-bold text-primary">Arrastra o elige un archivo .he-backup</span>
        <input type="file" accept=".he-backup" className="sr-only" aria-label="Archivo .he-backup" onChange={(e) => handleFile(e.target.files?.[0])} />
      </label>

      {canScan && (
        <div className="space-y-2">
          <video ref={videoRef} muted playsInline className={scanning ? 'w-full rounded-xl' : 'hidden'} />
          {scanning ? (
            <p aria-live="polite" className="text-sm text-tertiary text-center">
              {progress.total > 1 ? `Fragmentos: ${progress.received}/${progress.total}` : 'Apunta al QR…'}
            </p>
          ) : (
            <button onClick={startScan} className="w-full px-4 py-3 rounded-xl bg-surface/10 font-bold text-primary">Escanear QR con la cámara</button>
          )}
        </div>
      )}

      <details>
        <summary className="text-sm text-tertiary cursor-pointer">Pegar código de respaldo</summary>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          aria-label="Código de respaldo"
          className="w-full h-24 mt-2 p-2 rounded-xl bg-surface/10 text-xs font-mono"
        />
        <button onClick={() => handlePayload(text)} disabled={!text.trim()} className="mt-2 px-4 py-2 rounded-xl bg-accent text-primary font-bold disabled:opacity-40">Validar</button>
      </details>

      {error && <p role="alert" className="text-sm font-bold text-red-500">{error}</p>}
    </div>
  );
};

const DeviceTransferModal = ({ mode, onClose }: Props) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="safe-area-modal-backdrop fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="transfer-modal-title"
        className="safe-area-modal-panel w-full max-w-md overflow-y-auto bg-surface border border-border/10 rounded-[2rem] p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 id="transfer-modal-title" className="text-xl font-black text-primary">
            {mode === 'send' ? 'Pasar a otro dispositivo' : 'Recibir desde otro dispositivo'}
          </h2>
          <button onClick={onClose} aria-label="Cerrar" className="p-2 text-tertiary">✕</button>
        </div>
        {mode === 'send' ? <SendPane /> : <ReceivePane onDone={onClose} />}
      </div>
    </div>
  );
};

export default DeviceTransferModal;
