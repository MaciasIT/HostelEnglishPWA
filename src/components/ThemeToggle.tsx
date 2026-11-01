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
  const { theme, setTheme } = useTheme();
  return (
    <div role="radiogroup" aria-label="Tema" className="flex items-center gap-0.5 p-1 bg-surface/5 border border-border/10 rounded-full">
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
  );
};

export default ThemeToggle;
