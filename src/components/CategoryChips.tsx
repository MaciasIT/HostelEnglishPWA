import React from 'react';
import { haptics } from '@/utils/haptics';

export interface ChipOption {
  value: string;
  label: string;
  emoji?: string;
}

interface CategoryChipsProps {
  options: ChipOption[];
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  className?: string;
}

/** Emoji por categoría (normalizada); fallback 🏷️. */
const CATEGORY_EMOJI: Record<string, string> = {
  recepcion: '🏨', harrera: '🏨', bar: '🍸', restaurante: '🍽️', jatetxea: '🍽️',
  'room service': '🛎️', cocina: '👨‍🍳', sukaldea: '👨‍🍳', limpieza: '🧹',
  mantenimiento: '🛠️', quejas: '💬', kexak: '💬', 'quejas y reclamaciones': '💬',
  'kexak eta erreklamazioak': '💬', general: '🌐',
};

export const emojiForCategory = (category: string): string =>
  CATEGORY_EMOJI[category.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()] ?? '🏷️';

/** Barra de chips horizontal deslizable con el pulgar (sustituye al <select> nativo). */
const CategoryChips: React.FC<CategoryChipsProps> = ({ options, value, onChange, ariaLabel, className = '' }) => (
  <div
    role="group"
    aria-label={ariaLabel}
    className={`overflow-x-auto no-scrollbar flex items-center gap-2 py-2 px-1 snap-x ${className}`}
  >
    {options.map((opt) => {
      const active = opt.value === value;
      return (
        <button
          key={opt.value}
          type="button"
          aria-pressed={active}
          onClick={() => {
            if (!active) {
              haptics.trigger('SELECTION');
              onChange(opt.value);
            }
          }}
          className={`shrink-0 snap-start min-h-11 px-4 rounded-full border text-sm font-bold whitespace-nowrap transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-accent outline-none ${
            active
              ? 'bg-accent text-on-accent border-accent shadow-lg'
              : 'bg-surface/5 text-primary border-border/15 hover:bg-surface/10'
          }`}
        >
          {opt.emoji ? `${opt.emoji} ${opt.label}` : opt.label}
        </button>
      );
    })}
  </div>
);

export default CategoryChips;
