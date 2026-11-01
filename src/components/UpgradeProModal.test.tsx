import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useAppStore } from '@/store/useAppStore';
import UpgradeProModal from './UpgradeProModal';

describe('UpgradeProModal', () => {
  beforeEach(() => {
    useAppStore.setState({ isPremium: false, licenseInfo: null });
  });

  it('no renderiza si está cerrado', () => {
    render(<UpgradeProModal isOpen={false} onClose={() => {}} />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('muestra ventajas y enlace de compra', () => {
    render(<UpgradeProModal isOpen onClose={() => {}} />);
    expect(screen.getByText(/Roleplay ilimitado/i)).toBeTruthy();
    expect(screen.getByText(/Diploma con QR/i)).toBeTruthy();
    expect(screen.getByRole('link', { name: /Obtener Pase Pro/i })).toBeTruthy();
  });

  it('muestra error con clave vacía', async () => {
    render(<UpgradeProModal isOpen onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Activar' }));
    expect((await screen.findByRole('alert')).textContent).toMatch(/Introduce/);
  });

  it('muestra error con clave inválida y no activa Pro', async () => {
    useAppStore.setState({
      activateLicense: vi.fn().mockResolvedValue({ success: false, error: 'Firma de licencia inválida.' }),
    } as never);
    render(<UpgradeProModal isOpen onClose={() => {}} />);
    fireEvent.change(screen.getByLabelText(/Clave de activación/i), { target: { value: 'x.y' } });
    fireEvent.click(screen.getByRole('button', { name: 'Activar' }));
    expect((await screen.findByRole('alert')).textContent).toMatch(/Firma/);
    expect(useAppStore.getState().isPremium).toBe(false);
  });

  it('activa Pro con clave válida y muestra éxito', async () => {
    useAppStore.setState({
      activateLicense: vi.fn().mockImplementation(async () => {
        useAppStore.setState({ isPremium: true });
        return { success: true };
      }),
    } as never);
    render(<UpgradeProModal isOpen onClose={() => {}} />);
    fireEvent.change(screen.getByLabelText(/Clave de activación/i), { target: { value: 'valid.key' } });
    fireEvent.click(screen.getByRole('button', { name: 'Activar' }));
    await waitFor(() => expect(screen.getByText(/Licencia activada/i)).toBeTruthy());
    expect(useAppStore.getState().isPremium).toBe(true);
  });

  it('cierra con Escape', () => {
    const onClose = vi.fn();
    render(<UpgradeProModal isOpen onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});
