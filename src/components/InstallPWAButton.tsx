import React from 'react';
import { useBeforeInstallPrompt } from '@/hooks/useBeforeInstallPrompt';

/**
 * Custom hook: tracks scroll direction to hide UI elements on scroll down.
 * Returns 'up', 'down', or null (when at top).
 */
function useScrollDirection(): 'up' | 'down' | null {
  const [direction, setDirection] = React.useState<'up' | 'down' | null>(null);
  const lastScrollY = React.useRef(0);

  React.useEffect(() => {
    let ticking = false;
    const update = () => {
      const current = window.scrollY;
      if (current <= 10) {
        setDirection(null);
      } else if (current > lastScrollY.current) {
        setDirection('down');
      } else {
        setDirection('up');
      }
      lastScrollY.current = current;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return direction;
}

const InstallPWAButton: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useBeforeInstallPrompt();
  const [visible, setVisible] = React.useState(false);
  const [dismissed, setDismissed] = React.useState(false);
  const scrollDir = useScrollDirection();

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

  // Hide when scrolling down, show when scrolling up or at top
  if (!visible || dismissed) return null;
  const hidden = scrollDir === 'down';

  return (
    <aside
      aria-label="Instalación de la aplicación"
      className={`fixed bottom-20 sm:bottom-4 right-4 z-40 bg-accent text-on-accent pl-4 pr-2 py-2 rounded-2xl shadow-2xl hover:brightness-105 transition-all duration-300 flex items-center gap-2 font-bold text-xs sm:text-sm border border-border/10 backdrop-blur-xl ${
        hidden ? 'translate-y-24 opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
      }`}
    >
      <button
        onClick={handleInstall}
        aria-label="Instalar app en tu dispositivo"
        className="flex items-center gap-2 cursor-pointer"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
        </svg>
        <span>Instalar App</span>
      </button>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Cerrar aviso de instalación"
        className="p-1.5 rounded-xl hover:bg-black/15 active:scale-90 transition-colors cursor-pointer text-on-accent/80 hover:text-on-accent"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
          <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
        </svg>
      </button>
    </aside>
  );
};

export default InstallPWAButton;
