import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DeviceTransferModal from './DeviceTransferModal';
import { useAppStore } from '@/store/useAppStore';
import { createBackupPayload, backupFileName } from '@/services/sync/backupService';

describe('DeviceTransferModal', () => {
  it('modo enviar muestra un QR', async () => {
    render(<DeviceTransferModal mode="send" onClose={() => {}} />);
    expect(await screen.findByRole('img', { name: /código qr/i })).toBeTruthy();
  });

  it('modo recibir: importa .he-backup tras confirmación', async () => {
    useAppStore.setState({ achievements: ['x1', 'x2'] } as never);
    const payload = await createBackupPayload();
    useAppStore.setState({ achievements: [] } as never);
    render(<DeviceTransferModal mode="receive" onClose={() => {}} />);
    const input = screen.getByLabelText('Archivo .he-backup') as HTMLInputElement;
    await userEvent.upload(input, new File([payload], backupFileName()), { applyAccept: false });
    await screen.findByText(/respaldo válido/i);
    expect(useAppStore.getState().achievements).toEqual([]);
    await userEvent.click(screen.getByRole('button', { name: 'Restaurar' }));
    await waitFor(() => expect(useAppStore.getState().achievements).toEqual(['x1', 'x2']));
  });

  it('modo recibir: muestra error con archivo corrupto', async () => {
    render(<DeviceTransferModal mode="receive" onClose={() => {}} />);
    const input = screen.getByLabelText('Archivo .he-backup') as HTMLInputElement;
    await userEvent.upload(input, new File(['basura'], 'x.he-backup'), { applyAccept: false });
    expect((await screen.findByRole('alert')).textContent).toBeTruthy();
  });
});
