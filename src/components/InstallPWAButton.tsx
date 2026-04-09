import React from 'react';
import { useBeforeInstallPrompt } from '@/hooks/useBeforeInstallPrompt';

const InstallPWAButton: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useBeforeInstallPrompt();
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    setVisible(!!deferredPrompt);
  }, [deferredPrompt]);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      setVisible(false);
    }
  };

  if (!visible) return null;

  return (
    <button
      onClick={handleInstall}
      aria-label="Instalar app en tu dispositivo"
      className="fixed bottom-20 sm:bottom-4 right-4 z-50 bg-accent text-white px-6 py-3 rounded-2xl shadow-2xl hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 font-bold text-sm border border-white/10 backdrop-blur-xl"
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
      </svg>
      Instalar App
    </button>
  );
};

export default InstallPWAButton;
