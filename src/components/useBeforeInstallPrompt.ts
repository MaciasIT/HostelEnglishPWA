import { useEffect, useState } from 'react';

export function useBeforeInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  return [deferredPrompt, setDeferredPrompt] as const;
}

// Solo para test
export const __setDeferredPrompt = (prompt: any) => {};
