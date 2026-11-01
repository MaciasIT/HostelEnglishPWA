import { motion } from 'framer-motion';
import {
  ShieldCheckIcon,
  SparklesIcon,
  TrophyIcon,
  CheckBadgeIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline';
import { Certification } from '@/store/types';

interface CertificationBadgeProps {
  certification: Certification;
  onShare?: () => void;
  compact?: boolean;
}

const ROLE_GRADIENTS: Record<string, string> = {
  recepcion: 'from-blue-500/30 to-indigo-600/30',
  restaurante: 'from-orange-500/30 to-rose-600/30',
  limpieza: 'from-teal-500/30 to-emerald-600/30',
  mantenimiento: 'from-amber-500/30 to-yellow-600/30',
  bar: 'from-purple-500/30 to-pink-600/30',
};

export default function CertificationBadge({
  certification,
  onShare,
  compact = false
}: CertificationBadgeProps) {
  const { studentName, role, roleLabel, examDate, score, total, accuracy, categoryScores, competencyIndex, passed, verificationCode } = certification;

  const pct = Math.round(accuracy * 100);
  const gradient = ROLE_GRADIENTS[role] || 'from-accent/30 to-blue-600/30';

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-3 bg-gradient-to-r ${gradient} border border-border/20 px-5 py-3 rounded-2xl backdrop-blur-md`}>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${passed ? 'bg-yellow-500' : 'bg-gray-600'}`}>
          {passed ? (
            <TrophyIcon className="w-5 h-5 text-primary" />
          ) : (
            <ShieldCheckIcon className="w-5 h-5 text-primary opacity-50" />
          )}
        </div>
        <div>
          <p className="text-primary font-black text-sm leading-tight">{roleLabel}</p>
          <p className="text-tertiary text-xs font-bold">{pct}% · {examDate}</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ scale: 0.85, opacity: 0, rotate: -2 }}
      animate={{ scale: 1, opacity: 1, rotate: 0 }}
      transition={{ type: 'spring', bounce: 0.3, duration: 0.8 }}
      className={`relative max-w-lg mx-auto bg-gradient-to-br ${gradient} rounded-[3rem] border-2 border-border/20 shadow-2xl backdrop-blur-xl overflow-hidden`}
      role="figure"
      aria-label={`Certificado de ${roleLabel} para ${studentName}`}
    >
      {/* Decorative corner ornaments */}
      <div className="absolute top-0 left-0 w-24 h-24 border-t-4 border-l-4 border-border/30 rounded-tl-[3rem]" aria-hidden="true" />
      <div className="absolute bottom-0 right-0 w-24 h-24 border-b-4 border-r-4 border-border/30 rounded-br-[3rem]" aria-hidden="true" />

      <div className="p-10 text-center relative">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 shadow-2xl ${passed ? 'bg-yellow-500' : 'bg-gray-600'}`}>
            {passed ? (
              <TrophyIcon className="w-10 h-10 text-primary" />
            ) : (
              <ShieldCheckIcon className="w-10 h-10 text-primary opacity-50" />
            )}
          </div>
          <p className="text-[10px] uppercase font-black tracking-[0.3em] text-primary/60 mb-2">
            Certificación Laboral
          </p>
          <h2 className="text-2xl font-black text-primary leading-tight">{roleLabel}</h2>
          <p className="text-primary/50 text-xs font-semibold mt-1">HostelEnglish Professional</p>
        </motion.div>

        {/* Divider */}
        <div className="w-24 h-1 bg-surface/20 mx-auto rounded-full mb-8" aria-hidden="true" />

        {/* Student Name */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <p className="text-[10px] uppercase font-black tracking-[0.2em] text-primary/50 mb-2">Certificado a</p>
          <p className="text-3xl font-black text-primary tracking-tight">{studentName}</p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <StatBox label="Puntuación" value={`${score}/${total}`} accent={passed} />
          <StatBox label="Precisión" value={`${pct}%`} accent={pct >= 80} />
          <StatBox label="Índice" value={`${competencyIndex}`} accent={competencyIndex >= 70} />
        </div>

        {/* Category breakdown */}
        <div className="mb-8">
          <p className="text-[10px] uppercase font-black tracking-[0.2em] text-primary/50 mb-3">
            Competencia por área
          </p>
          <div className="space-y-2">
            {categoryScores.slice(0, 4).map(cat => (
              <div key={cat.category} className="flex items-center gap-3">
                <span className="text-xs text-secondary font-semibold w-28 text-left truncate">{cat.category}</span>
                <div className="flex-1 h-2 bg-surface/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.round(cat.accuracy * 100)}%` }}
                    transition={{ delay: 0.6, duration: 0.8 }}
                    className={`h-full rounded-full ${cat.accuracy >= 0.7 ? 'bg-green-400' : cat.accuracy >= 0.4 ? 'bg-yellow-400' : 'bg-red-400'}`}
                  />
                </div>
                <span className="text-[10px] font-black text-primary/70 w-10 text-right">
                  {Math.round(cat.accuracy * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2 bg-surface/5 border border-border/10 px-4 py-2 rounded-xl">
            <CheckBadgeIcon className="w-4 h-4 text-green-400" aria-hidden="true" />
            <span className="text-[10px] font-mono text-primary/60 tracking-widest">
              {verificationCode}
            </span>
            <button
              onClick={onShare}
              className="ml-2 text-primary/40 hover:text-primary transition-colors"
              aria-label="Copiar código de verificación"
              title="Copiar código"
            >
              <DocumentDuplicateIcon className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[10px] text-primary/40 font-medium">
            Expedido el {examDate} · Válido para portfolio profesional
          </p>
        </div>

        {/* Passed / Failed watermark */}
        <div className="absolute top-4 right-6 opacity-[0.07] pointer-events-none" aria-hidden="true">
          {passed ? (
            <SparklesIcon className="w-32 h-32 text-primary" />
          ) : (
            <ShieldCheckIcon className="w-32 h-32 text-primary" />
          )}
        </div>
      </div>
    </motion.div>
  );
}

function StatBox({ label, value, accent }: { label: string; value: string; accent: boolean }) {
  return (
    <div className={`p-4 rounded-2xl border ${accent ? 'bg-success/10 border-green-500/20' : 'bg-surface/5 border-border/10'}`}>
      <p className="text-[9px] uppercase font-black text-primary/50 tracking-widest mb-1">{label}</p>
      <p className={`text-xl font-black ${accent ? 'text-green-300' : 'text-primary'}`}>{value}</p>
    </div>
  );
}
