import React, { useEffect } from 'react';
import { Link } from 'react-router';
import { useAppStore } from '@/store/useAppStore';
import { JOB_ROLES } from '@/utils/roleFilter';
import type { JobRole } from '@/store/types';

interface RoleSelectionModalProps {
  /** Si se omite, se abre automáticamente cuando no hay rol elegido (primer arranque). */
  open?: boolean;
  onClose?: () => void;
}

const RoleSelectionModal: React.FC<RoleSelectionModalProps> = ({ open, onClose }) => {
  const selectedRole = useAppStore((s) => s.prefs.selectedRole);
  const setSelectedRole = useAppStore((s) => s.setSelectedRole);

  const isFirstRun = !selectedRole;
  const visible = open ?? isFirstRun;
  const dismissible = !isFirstRun && !!onClose;

  useEffect(() => {
    if (!visible || !dismissible) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [visible, dismissible, onClose]);

  if (!visible) return null;

  const choose = (role: JobRole) => {
    setSelectedRole(role);
    onClose?.();
  };

  return (
    <div className="safe-area-modal-backdrop fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="role-modal-title"
        className="safe-area-modal-panel w-full max-w-2xl overflow-y-auto bg-surface border border-border/10 rounded-[2rem] p-6 sm:p-8 shadow-2xl"
      >
        <h2 id="role-modal-title" className="text-2xl sm:text-3xl font-black text-primary mb-2">
          ¿Cuál es tu puesto de trabajo?
        </h2>
        <p className="text-tertiary mb-6">
          Personalizaremos frases, flashcards y retos para tu departamento. Puedes cambiarlo cuando quieras en Ajustes.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="radiogroup" aria-label="Rol laboral">
          {JOB_ROLES.map((r) => (
            <button
              key={r.id}
              type="button"
              role="radio"
              aria-checked={selectedRole === r.id}
              onClick={() => choose(r.id)}
              className={`text-left p-4 rounded-2xl border transition-all active:scale-95 focus:ring-2 focus:ring-accent outline-none ${
                selectedRole === r.id ? 'border-accent bg-accent/10' : 'border-border/10 bg-surface/5 hover:bg-surface/10'
              }`}
            >
              <span className="text-2xl mr-2" aria-hidden="true">{r.emoji}</span>
              <span className="font-black text-primary">{r.label}</span>
              <span className="block text-xs text-tertiary mt-1">{r.desc}</span>
            </button>
          ))}
        </div>
        <Link
          to="/equipo"
          onClick={() => {
            if (!selectedRole) setSelectedRole('general');
            onClose?.();
          }}
          className="mt-4 block p-4 rounded-2xl border border-dashed border-accent text-primary font-black focus:ring-2 focus:ring-accent outline-none"
        >
          <span aria-hidden="true">📋 </span>Soy encargado: auditar a mi equipo
          <span className="block text-xs font-normal text-tertiary mt-1">Importa los códigos QR de certificación de tu plantilla</span>
        </Link>
        {dismissible && (
          <button
            type="button"
            onClick={onClose}
            className="mt-6 text-sm font-bold text-tertiary hover:text-primary"
          >
            Cancelar
          </button>
        )}
      </div>
    </div>
  );
};

export default RoleSelectionModal;
