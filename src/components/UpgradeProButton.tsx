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
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={isPremium ? 'Licencia Pro activa' : 'Activar o comprar Pro'}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-colors ${
          isPremium
            ? 'text-accent border-accent/40'
            : 'text-tertiary border-border/20 hover:text-accent hover:border-accent/40'
        } ${className}`}
      >
        <SparklesIcon className="w-4 h-4" />
        <span>{text}</span>
      </button>
      <UpgradeProModal isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
};

export default UpgradeProButton;
