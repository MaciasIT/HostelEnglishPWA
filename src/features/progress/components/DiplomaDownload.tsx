import { useRef, useState } from 'react';
import {
  buildDiplomaSvg,
  diplomaToPngBlob,
  openPrintWindow,
  printDiplomaAsPdf,
  shareOrDownloadBlob,
  signDiploma,
  yieldToMain,
  type DiplomaData,
} from '../lib/diploma';

type Kind = 'png' | 'pdf';

export default function DiplomaDownload({ data }: { data: DiplomaData }) {
  const [busy, setBusy] = useState<Kind | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const lock = useRef(false);

  const run = async (kind: Kind) => {
    if (lock.current) return;
    lock.current = true;
    setBusy(kind);
    setError(null);
    setInfo(null);
    // La ventana se abre dentro del gesto del usuario para evitar el bloqueo de popups móviles.
    const win = kind === 'pdf' ? openPrintWindow() : null;
    try {
      await yieldToMain(); // permite pintar el estado "Generando diploma..."
      const signed = await signDiploma(data);
      await yieldToMain();
      const svg = buildDiplomaSvg(signed); // cálculo del QR
      await yieldToMain();
      if (kind === 'png' || !win) {
        const blob = await diplomaToPngBlob(svg, 2);
        const res = await shareOrDownloadBlob(blob, `diploma-${data.certId}.png`);
        if (kind === 'pdf') setInfo('Tu navegador bloqueó la ventana de impresión; se ha guardado el diploma como PNG.');
        else if (res === 'downloaded') setInfo('Diploma descargado.');
      } else {
        printDiplomaAsPdf(svg, win);
      }
    } catch (e) {
      win?.close();
      setError(e instanceof Error ? e.message : 'Error generando el diploma');
    } finally {
      lock.current = false;
      setBusy(null);
    }
  };

  const label = (kind: Kind, text: string) => (busy === kind ? 'Generando diploma...' : text);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2" aria-busy={busy !== null}>
        <button type="button" disabled={busy !== null} onClick={() => run('png')} className="min-h-11 px-4 py-3 rounded-xl bg-indigo-600 text-white inline-flex items-center justify-center disabled:opacity-60">
          {label('png', 'Descargar PNG')}
        </button>
        <button type="button" disabled={busy !== null} onClick={() => run('pdf')} className="min-h-11 px-4 py-3 rounded-xl border border-indigo-500 inline-flex items-center justify-center disabled:opacity-60">
          {label('pdf', 'Imprimir / PDF')}
        </button>
      </div>
      <p role="status" aria-live="polite" className="text-sm">{info}</p>
      {error && <p role="alert" className="text-sm text-error-text">{error}</p>}
    </div>
  );
}
