import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAppStore } from '@/store/useAppStore';
import { useIsPremium } from '@/hooks/useIsPremium';
import {
  CheckCircleIcon,
  XMarkIcon,
  SparklesIcon,
  BuildingOffice2Icon,
  ChatBubbleLeftRightIcon,
  MicrophoneIcon,
  QrCodeIcon,
} from '@heroicons/react/24/outline';

export const PRO_PURCHASE_URL: string =
  (import.meta.env.VITE_PRO_PURCHASE_URL as string | undefined) || 'https://hostelenglish.app/pro';

const BENEFITS = [
  { icon: BuildingOffice2Icon, text: 'Todos los departamentos desbloqueados' },
  { icon: ChatBubbleLeftRightIcon, text: 'Roleplay ilimitado' },
  { icon: MicrophoneIcon, text: 'Scoring fonético de pronunciación' },
  { icon: QrCodeIcon, text: 'Diploma con QR verificable' },
];

interface UpgradeProModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UpgradeProModal: React.FC<UpgradeProModalProps> = ({ isOpen, onClose }) => {
  const isPremium = useIsPremium();
  const licenseInfo = useAppStore((s) => s.licenseInfo);
  const activateLicense = useAppStore((s) => s.activateLicense);
  const [key, setKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [justActivated, setJustActivated] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    inputRef.current?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      setKey('');
      setError(null);
      setJustActivated(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = key.trim();
    if (!trimmed) {
      setError('Introduce tu clave de licencia.');
      return;
    }
    setLoading(true);
    setError(null);
    const res = await activateLicense(trimmed);
    setLoading(false);
    if (res.success) {
      setJustActivated(true);
      setKey('');
    } else {
      setError(res.error ?? 'Licencia inválida.');
    }
  };

  const showSuccess = justActivated || isPremium;

  return createPortal(
    <div
      className="safe-area-modal-backdrop fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="safe-area-modal-panel relative w-full max-w-md bg-background border border-border/10 rounded-[2rem] p-6 sm:p-8 shadow-2xl animate-fade-in"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute top-4 right-4 min-w-11 min-h-11 p-2 rounded-xl text-tertiary hover:text-primary hover:bg-surface/5 transition-colors inline-flex items-center justify-center"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-accent/20 rounded-2xl text-accent-text">
            <SparklesIcon className="w-7 h-7" />
          </div>
          <h2 id={titleId} className="text-2xl font-black text-primary tracking-tight">
            HostelEnglish Pro
          </h2>
        </div>

        {showSuccess ? (
          <div role="status" className="text-center py-6 space-y-3">
            <CheckCircleIcon className="w-16 h-16 mx-auto text-success-text animate-bounce" />
            <p className="text-lg font-black text-primary">
              {justActivated ? '¡Licencia activada!' : 'Ya eres Pro'}
            </p>
            {licenseInfo && (
              <p className="text-xs text-tertiary">
                {licenseInfo.email} ·{' '}
                {licenseInfo.type === 'lifetime'
                  ? 'De por vida'
                  : licenseInfo.type === 'quarterly'
                  ? `Promoción 3 Meses (hasta ${new Date(licenseInfo.expiresAt).toLocaleDateString('es-ES')})`
                  : 'Anual'}
              </p>
            )}
            <button
              type="button"
              onClick={onClose}
              className="mt-4 px-6 py-3 rounded-2xl bg-accent text-primary font-bold hover:scale-105 active:scale-95 transition-transform"
            >
              Continuar
            </button>
          </div>
        ) : (
          <>
            <ul className="space-y-3 mb-6">
              {BENEFITS.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-sm text-primary">
                  <Icon className="w-5 h-5 text-accent-text shrink-0" />
                  {text}
                </li>
              ))}
            </ul>

            <form onSubmit={handleSubmit} className="space-y-3" noValidate>
              <label htmlFor={`${titleId}-key`} className="text-[10px] uppercase font-semibold text-tertiary tracking-widest">
                Clave de activación
              </label>
              <input
                id={`${titleId}-key`}
                ref={inputRef}
                value={key}
                onChange={(e) => {
                  setKey(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Pega aquí tu clave de licencia"
                autoComplete="off"
                spellCheck={false}
                aria-invalid={!!error}
                aria-describedby={error ? `${titleId}-err` : undefined}
                className="w-full p-3 bg-surface/5 border border-border/10 rounded-2xl text-sm text-primary font-mono focus:ring-2 focus:ring-accent outline-none"
              />
              {error && (
                <p id={`${titleId}-err`} role="alert" className="text-sm text-error-text">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 rounded-2xl bg-accent text-primary font-bold hover:brightness-110 active:scale-95 transition disabled:opacity-50"
              >
                {loading ? 'Validando…' : 'Activar'}
              </button>
            </form>

            <a
              href={PRO_PURCHASE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 block text-center text-sm font-bold text-accent-text hover:underline"
            >
              Obtener Pase Pro
            </a>
          </>
        )}
      </div>
    </div>,
    document.body
  );
};

export default UpgradeProModal;
