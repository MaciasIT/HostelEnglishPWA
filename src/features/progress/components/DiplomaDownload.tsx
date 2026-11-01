import { useState } from 'react';
import {
  buildDiplomaSvg,
  diplomaToPngBlob,
  downloadBlob,
  printDiplomaAsPdf,
  signDiploma,
  type DiplomaData,
} from '../lib/diploma';

export default function DiplomaDownload({ data }: { data: DiplomaData }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (kind: 'png' | 'pdf') => {
    setBusy(true);
    setError(null);
    try {
      const svg = buildDiplomaSvg(await signDiploma(data));
      if (kind === 'png') downloadBlob(await diplomaToPngBlob(svg, 2), `diploma-${data.certId}.png`);
      else printDiplomaAsPdf(svg);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error generando el diploma');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <button type="button" disabled={busy} onClick={() => run('png')} className="rounded-xl bg-indigo-600 text-white px-4 py-2">
          Descargar PNG
        </button>
        <button type="button" disabled={busy} onClick={() => run('pdf')} className="rounded-xl border border-indigo-500 px-4 py-2">
          Imprimir / PDF
        </button>
      </div>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
