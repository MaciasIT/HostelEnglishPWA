import React, { useState } from 'react';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { useIsPremium } from '@/hooks/useIsPremium';
import UpgradeProModal from '@/components/UpgradeProModal';

interface Props {
  className?: string;
  label?: string;
}

/** Botón discreto que abre el modal de upgrade/activación Pro. */
const UpgradeProButton: React.FC<Props> = ({ className = '', label }) => {
  const isPremium = useIsPremium();
  const [open, setOpen] = useState(false);
  const text = label ?? (isPremium ? 'Pro' : 'Upgrade');
  const isExplicitLabel = Boolean(label);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={isPremium ? 'Licencia Pro activa' : 'Activar o comprar Pro'}
        className={`flex items-center gap-1.5 p-2 sm:px-2.5 sm:py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-[color,border-color,box-shadow] shrink-0 ${
          isPremium
            ? 'text-accent-text border-accent/40 shadow-[0_0_14px_-2px_var(--accent-glow)]'
            : 'text-tertiary border-border/20 hover:text-accent-text hover:border-accent/40 hover:shadow-[0_0_12px_-3px_var(--accent-glow)]'
        } ${className}`}
      >
        <SparklesIcon className="w-4 h-4" />
        <span className={isExplicitLabel ? 'inline' : 'hidden sm:inline'}>{text}</span>
      </button>
      <UpgradeProModal isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
};

export default UpgradeProButton;
