import { CLIENT_ACCENTS } from '../accents';
import type { ClientAccent } from '../accents';

interface RoleplayAccentSelectorProps {
  value: ClientAccent;
  onChange: (accent: ClientAccent) => void;
}

/** Selector de cliente / acento (radiogroup accesible). */
export default function RoleplayAccentSelector({ value, onChange }: RoleplayAccentSelectorProps) {
  return (
    <div role="radiogroup" aria-label="Acento del cliente" className="flex flex-wrap justify-center gap-2">
      {CLIENT_ACCENTS.map((accent) => {
        const active = accent.id === value;
        return (
          <button
            key={accent.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(accent.id)}
            className={`px-4 py-2 rounded-2xl text-sm font-bold border transition-colors ${
              active
                ? 'bg-accent text-on-accent border-accent'
                : 'bg-surface/5 text-secondary border-border/15 hover:bg-surface/10'
            }`}
          >
            <span aria-hidden="true">{accent.flag} </span>
            {accent.label}
            <span className="block text-[10px] font-medium opacity-80">{accent.detail}</span>
          </button>
        );
      })}
    </div>
  );
}
