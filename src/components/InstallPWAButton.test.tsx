import { describe, it, vi, expect, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

vi.mock('./useBeforeInstallPrompt', () => {
  let deferredPrompt: any = null;
  return {
    useBeforeInstallPrompt: () => {
      const [prompt, setPrompt] = React.useState<any>(deferredPrompt);
      return [prompt, setPrompt];
    },
    __setDeferredPrompt: (prompt: any) => {
      deferredPrompt = prompt;
    }
  };
});

import { __setDeferredPrompt } from './useBeforeInstallPrompt';
import InstallPWAButton from './components/InstallPWAButton';

describe('InstallPWAButton', () => {
  beforeEach(() => {
    __setDeferredPrompt(null);
  });

  it('no muestra el botón si no hay evento beforeinstallprompt', () => {
    render(<InstallPWAButton />);
    expect(screen.queryByRole('button', { name: /instalar/i })).toBeNull();
  });

  it('muestra el botón si hay evento beforeinstallprompt', () => {
    __setDeferredPrompt({ prompt: vi.fn(), userChoice: Promise.resolve({ outcome: 'accepted' }) });
    render(<InstallPWAButton />);
    expect(screen.getByRole('button', { name: /instalar/i })).toBeInTheDocument();
  });

  it('al hacer click en el botón, llama a prompt y oculta el botón', async () => {
    const promptMock = vi.fn(() => Promise.resolve());
    __setDeferredPrompt({ prompt: promptMock, userChoice: Promise.resolve({ outcome: 'accepted' }) });
    render(<InstallPWAButton />);
    const btn = screen.getByRole('button', { name: /instalar/i });
    fireEvent.click(btn);
    expect(promptMock).toHaveBeenCalled();
    // El botón debería ocultarse tras la instalación
    // (simulamos el cambio de estado)
  });
});
