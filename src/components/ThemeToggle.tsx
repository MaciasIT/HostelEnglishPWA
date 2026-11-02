import React from 'react';
import { SunIcon, MoonIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';
import { useTheme } from '@/hooks/useTheme';
import type { ThemePreference } from '@/store/types';

const OPTIONS: { value: ThemePreference; label: string; Icon: typeof SunIcon }[] = [
  { value: 'light', label: 'Modo claro', Icon: SunIcon },
  { value: 'auto', label: 'Modo automático', Icon: ComputerDesktopIcon },
  { value: 'dark', label: 'Modo oscuro', Icon: MoonIcon },
];

const ThemeToggle: React.FC = () => {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <>
      {/* Botón único para móvil (< sm): ahorra espacio horizontal evitando desbordamientos */}
      <button
        type="button"
        aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        title={isDark ? 'Modo claro' : 'Modo oscuro'}
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        className="sm:hidden min-w-11 min-h-11 p-2 rounded-full border border-border/10 bg-surface/5 text-primary hover:bg-surface/10 transition-colors active:scale-95 flex items-center justify-center shrink-0"
      >
        {isDark ? <SunIcon className="w-4 h-4 text-warning-text" /> : <MoonIcon className="w-4 h-4 text-info-text" />}
      </button>

      {/* Selector de 3 opciones completo para tablets y escritorio (≥ sm) */}
      <div
        role="radiogroup"
        aria-label="Tema"
        className="hidden sm:flex items-center gap-0.5 p-1 bg-surface/5 border border-border/10 rounded-full shrink-0"
      >
        {OPTIONS.map(({ value, label, Icon }) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={theme === value}
            aria-label={label}
            title={label}
            onClick={() => setTheme(value)}
            className={`p-1.5 rounded-full transition-colors active:scale-95 ${
              theme === value ? 'bg-accent text-white' : 'text-primary hover:bg-surface/10'
            }`}
          >
            <Icon className="w-4 h-4" />
          </button>
        ))}
      </div>
    </>
  );
};

export default ThemeToggle;
