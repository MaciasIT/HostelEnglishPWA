import { useEffect, useState } from 'react';

/**
 * Custom hook to capture the 'beforeinstallprompt' event.
 * Allows the app to trigger the PWA installation prompt manually.
 */
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

// Only for testing purposes to mock the prompt state
export const __setDeferredPrompt = (_prompt: any) => {};
