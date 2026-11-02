import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const blob = new Blob(['x'], { type: 'image/png' });
vi.mock('../lib/diploma', async (orig) => ({
  ...(await orig<typeof import('../lib/diploma')>()),
  signDiploma: vi.fn(async (d: unknown) => ({ data: d, code: 'c' })),
  buildDiplomaSvg: vi.fn(() => '<svg/>'),
  diplomaToPngBlob: vi.fn(async () => blob),
}));
import DiplomaDownload from './DiplomaDownload';
import { shareOrDownloadBlob } from '../lib/diploma';

const data = { studentName: 'Ana', department: 'Recepción', grade: 90, date: '2026-11-02', certId: 'X1' };
const nav = navigator as unknown as Record<string, unknown>;

describe('DiplomaDownload móvil', () => {
  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => 'blob:x');
    URL.revokeObjectURL = vi.fn();
  });
  afterEach(() => {
    vi.restoreAllMocks();
    delete nav.share;
    delete nav.canShare;
  });

  it('con Web Share API comparte el archivo y bloquea toques durante la carga', async () => {
    let release: () => void = () => {};
    const share = vi.fn(() => new Promise<void>((r) => (release = r)));
    Object.assign(nav, { share, canShare: () => true });
    render(<DiplomaDownload data={data} />);
    await userEvent.click(screen.getByRole('button', { name: /descargar png/i }));
    expect(screen.getByRole('button', { name: /generando diploma/i })).toBeDisabled();
    await waitFor(() => expect(share).toHaveBeenCalledTimes(1));
    const arg = (share.mock.calls[0] as unknown[])[0] as { files: File[] };
    expect(arg.files[0].name).toBe('diploma-X1.png');
    release();
    await waitFor(() => expect(screen.getByRole('button', { name: /descargar png/i })).toBeEnabled());
  });

  it('sin Web Share API usa <a download>', async () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    render(<DiplomaDownload data={data} />);
    await userEvent.click(screen.getByRole('button', { name: /descargar png/i }));
    await waitFor(() => expect(click).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByText('Diploma descargado.')).toBeInTheDocument());
  });

  it('si el usuario cancela el share no descarga', async () => {
    const share = vi.fn().mockRejectedValue(new DOMException('c', 'AbortError'));
    Object.assign(nav, { share, canShare: () => true });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    render(<DiplomaDownload data={data} />);
    await userEvent.click(screen.getByRole('button', { name: /descargar png/i }));
    await waitFor(() => expect(share).toHaveBeenCalled());
    expect(click).not.toHaveBeenCalled();
  });

  it('PDF con popup bloqueado cae a PNG', async () => {
    vi.spyOn(window, 'open').mockReturnValue(null);
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    render(<DiplomaDownload data={data} />);
    await userEvent.click(screen.getByRole('button', { name: /imprimir/i }));
    await waitFor(() => expect(click).toHaveBeenCalled());
    expect(await screen.findByText(/bloqueó la ventana/i)).toBeInTheDocument();
  });

  it('shareOrDownloadBlob: share fallido (NotAllowed) cae a descarga', async () => {
    Object.assign(nav, { share: vi.fn().mockRejectedValue(new DOMException('n', 'NotAllowedError')), canShare: () => true });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    expect(await shareOrDownloadBlob(blob, 'a.png')).toBe('downloaded');
    expect(click).toHaveBeenCalled();
  });
});
