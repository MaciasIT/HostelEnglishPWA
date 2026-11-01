import React from 'react';
import type { JobRole } from '@/store/types';
import { ROLE_LABELS } from '@/utils/roleFilter';

export type RoleScope = 'role' | 'all';

interface Props {
  role: JobRole | null | undefined;
  scope: RoleScope;
  onChange: (s: RoleScope) => void;
}

/** Pestañas "Mi departamento" / "Todo". No se muestra para rol general o sin rol. */
const RoleScopeTabs: React.FC<Props> = ({ role, scope, onChange }) => {
  if (!role || role === 'general') return null;
  const tab = (id: RoleScope, label: string) => (
    <button
      type="button"
      role="tab"
      aria-selected={scope === id}
      onClick={() => onChange(id)}
      className={`px-5 py-2 rounded-xl text-sm font-black transition-all ${
        scope === id ? 'bg-accent text-primary shadow-lg' : 'bg-surface/5 text-tertiary hover:text-primary'
      }`}
    >
      {label}
    </button>
  );
  return (
    <div role="tablist" aria-label="Ámbito de contenido" className="flex gap-2 mb-4">
      {tab('role', ROLE_LABELS[role])}
      {tab('all', 'Todo')}
    </div>
  );
};

export default RoleScopeTabs;
