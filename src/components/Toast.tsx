import React, { useEffect, useState } from 'react';
import { CheckCircleIcon, XCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
}

const iconMap: Record<ToastType, React.ElementType> = {
  success: CheckCircleIcon,
  error: XCircleIcon,
  info: InformationCircleIcon,
};

const colorMap: Record<ToastType, string> = {
  success: 'bg-green-500/20 border-green-500/30 text-green-400',
  error: 'bg-red-500/20 border-red-500/30 text-red-400',
  info: 'bg-blue-500/20 border-blue-500/30 text-blue-400',
};

const Toast: React.FC<ToastProps> = ({ message, type = 'success', duration = 3000, onClose }) => {
  const [isExiting, setIsExiting] = useState(false);
  const Icon = iconMap[type];

  useEffect(() => {
    const exitTimer = setTimeout(() => setIsExiting(true), duration - 300);
    const closeTimer = setTimeout(onClose, duration);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(closeTimer);
    };
  }, [duration, onClose]);

  return (
    <div
      className={`fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3 px-6 py-4 rounded-2xl border backdrop-blur-xl shadow-2xl ${colorMap[type]} ${isExiting ? 'toast-exit' : 'toast-enter'}`}
      role="status"
      aria-live="polite"
    >
      <Icon className="w-6 h-6 flex-shrink-0" />
      <span className="text-sm font-semibold text-white">{message}</span>
    </div>
  );
};

export default Toast;
