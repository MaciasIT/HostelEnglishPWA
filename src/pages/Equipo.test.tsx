import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Equipo from './Equipo';
import { signDiploma } from '@/features/progress/lib/diploma';

async function code(name: string, department: string, grade: number) {
  const pair = (await crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify'])) as CryptoKeyPair;
  const keys = { privateKey: pair.privateKey, publicRaw: new Uint8Array(await crypto.subtle.exportKey('raw', pair.publicKey)) };
  return (await signDiploma({ studentName: name, department, grade, date: '2026-11-02', certId: name }, keys)).code;
}

describe('Equipo', () => {
  beforeEach(() => {
    try {
      localStorage?.clear?.();
    } catch {
      /* entorno de test sin localStorage */
    }
  });

  it('importa códigos y muestra alerta roja de alérgenos en Sala', async () => {
    render(<Equipo />);
    expect(screen.queryByRole('alert')).toBeNull();
    const c1 = await code('Ana', 'Restaurante', 90);
    const c2 = await code('Luis', 'Restaurante', 40);
    fireEvent.change(screen.getByLabelText(/Pega los códigos/), { target: { value: `${c1}\n${c2}` } });
    fireEvent.click(screen.getByRole('button', { name: 'Importar códigos' }));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toMatch(/50%/));
    expect(screen.getByTestId('dept-sala').textContent).toContain('50%');
    expect(screen.getByTestId('import-status').textContent).toContain('2 código(s) importado(s)');
  });

  it('rechaza códigos inválidos', async () => {
    render(<Equipo />);
    fireEvent.change(screen.getByLabelText(/Pega los códigos/), { target: { value: 'HE1.x.y.z' } });
    fireEvent.click(screen.getByRole('button', { name: 'Importar códigos' }));
    await waitFor(() => expect(screen.getByTestId('import-status').textContent).toContain('1 inválido(s)'));
  });
});
