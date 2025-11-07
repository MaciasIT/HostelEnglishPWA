import React from 'react';
import { useBeforeInstallPrompt } from './useBeforeInstallPrompt';

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
    <button onClick={handleInstall} aria-label="Instalar app">
      Instalar app
    </button>
  );
};

export default InstallPWAButton;
