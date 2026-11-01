import React, { useMemo } from 'react';
import { CheckCircleIcon, FireIcon, GiftIcon } from '@heroicons/react/24/outline';
import { useAppStore, useShallow } from '@/store/useAppStore';

// ---------------------------------------------------------------------------
// Hook: derived state for daily challenge
// ---------------------------------------------------------------------------
export function useDailyChallenge() {
  const { currentChallenge, lastChallengeDate, ensureDailyChallenge, completeStep, claimReward, prefs } =
    useAppStore(
      useShallow((state) => ({
        currentChallenge: state.currentChallenge,
        lastChallengeDate: state.lastChallengeDate,
        ensureDailyChallenge: state.ensureDailyChallenge,
        completeStep: state.completeStep,
        claimReward: state.claimReward,
        prefs: state.prefs,
      }))
    );

  // Ensure challenge is loaded for current role
  React.useEffect(() => {
    ensureDailyChallenge(prefs.preferredRole);
  }, [ensureDailyChallenge, prefs.preferredRole]);

  const progress = useMemo(() => {
    if (!currentChallenge) return { completed: 0, total: 0 };
    const total = currentChallenge.steps.length;
    const completed = currentChallenge.steps.filter((s) => s.completed).length;
    return { completed, total };
  }, [currentChallenge]);

  return {
    challenge: currentChallenge,
    progress,
    completeStep,
    claimReward,
    isToday: lastChallengeDate === new Date().toISOString().split('T')[0],
  };
}

// ---------------------------------------------------------------------------
// Componente visual
// ---------------------------------------------------------------------------
const ROLE_LABELS: Record<string, string> = {
  bar: '🍹 Barra',
  recepcion: '🛎 Recepción',
  restaurante: '🍽 Restaurante',
  mantenimiento: '🔧 Mantenimiento',
  limpieza: '🧹 Limpieza',
};

const ROLE_GRADIENTS: Record<string, string> = {
  bar: 'from-emerald-500/20 to-teal-600/20',
  recepcion: 'from-blue-500/20 to-cyan-600/20',
  restaurante: 'from-rose-500/20 to-pink-600/20',
  mantenimiento: 'from-slate-500/20 to-gray-600/20',
  limpieza: 'from-teal-500/20 to-emerald-600/20',
};

export default function DailyChallengeCard() {
  const { challenge, progress, completeStep, claimReward, isToday } = useDailyChallenge();

  if (!challenge || !isToday) {
    return null;
  }

  const isComplete = challenge.completed;
  const isClaimed = challenge.claimed;
  const progressPct = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;

  const handleCompleteStep = (stepId: string) => {
    if (isComplete || isClaimed) return;
    completeStep(stepId);
  };

  const handleClaimReward = () => {
    const reward = claimReward();
    if (!reward) return;
    // TODO: integrate with actual XP/stats display (acumular en progressSlice)
    alert(`+${reward.xp} XP | +${reward.streak} 🔥 racha`);
  };

  return (
    <section
      className={`bg-gradient-to-br ${ROLE_GRADIENTS[challenge.role] || ROLE_GRADIENTS.bar} backdrop-blur-md p-6 sm:p-8 rounded-[2.5rem] border border-border/10 shadow-2xl relative overflow-hidden`}
      aria-labelledby="daily-challenge-heading"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 relative z-10">
        <div>
          <p className="text-[10px] uppercase font-bold text-accent tracking-[0.2em] mb-1">
            Reto Diario · {ROLE_LABELS[challenge.role] ?? challenge.role}
          </p>
          <h2 id="daily-challenge-heading" className="text-xl sm:text-2xl font-black text-primary tracking-tight">
            {challenge.title}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          {/* Rewards */}
          <div className="flex items-center gap-2 bg-background/20 px-4 py-2 rounded-2xl border border-border/10">
            <GiftIcon className="w-5 h-5 text-yellow-400" />
            <span className="text-sm font-bold text-primary">+{challenge.xpReward} XP</span>
          </div>
          <div className="flex items-center gap-2 bg-background/20 px-4 py-2 rounded-2xl border border-accent/30 shadow-[0_0_14px_-4px_var(--accent-glow)]">
            <FireIcon className="w-5 h-5 text-accent animate-flame" aria-hidden="true" />
            <span className="text-sm font-black text-accent" data-testid="daily-streak">+{challenge.streakReward} días de racha</span>
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-secondary font-medium text-sm leading-relaxed mb-6 relative z-10">
        {challenge.description}
      </p>

      {/* Progress bar */}
      <div className="mb-6 relative z-10">
        <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-tertiary mb-2">
          <span>Progreso</span>
          <span aria-hidden="true">{progress.completed}/{progress.total} · {progressPct}%</span>
        </div>
        <div
          className="w-full h-3 bg-surface/5 rounded-full overflow-hidden border border-border/5 shadow-inner"
          role="progressbar"
          aria-valuenow={progressPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Progreso del reto diario: ${progressPct}%`}
        >
          <div
            className="h-full bg-gradient-to-r from-accent to-accent-hover rounded-full transition-all duration-700 ease-out shadow-[0_0_12px_var(--accent-glow)]"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <ul className="space-y-3 mb-8 relative z-10" aria-label="Pasos del reto diario">
        {challenge.steps.map((step, idx) => {
          const done = step.completed;
          return (
            <li key={step.id}>
              <button
                type="button"
                onClick={() => handleCompleteStep(step.id)}
                disabled={done || isClaimed}
                aria-pressed={done}
                className={`w-full text-left flex items-start gap-4 p-4 rounded-2xl border transition-all
                  ${
                    done
                      ? 'bg-success/10 border-green-500/30 opacity-70'
                      : 'bg-surface/5 border-border/10 hover:bg-surface/10 hover:border-border/20 active:scale-[0.98]'
                  }
                  ${isClaimed ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <span className="flex-shrink-0 mt-0.5">
                  {done ? (
                    <CheckCircleIcon className="w-6 h-6 text-green-400" aria-hidden="true" />
                  ) : (
                    <span className="w-6 h-6 rounded-full border-2 border-border/20 flex items-center justify-center">
                      <span className="text-xs font-bold text-primary/60">{idx + 1}</span>
                    </span>
                  )}
                </span>
                <span
                  className={`text-sm font-medium leading-relaxed ${
                    done ? 'text-green-300 line-through' : 'text-primary'
                  }`}
                >
                  {step.description}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {/* Claim reward button */}
      {isComplete && !isClaimed && (
        <div className="relative z-10">
          <button
            type="button"
            onClick={handleClaimReward}
            className="w-full py-4 bg-gradient-to-r from-yellow-500 to-accent text-primary font-black rounded-2xl shadow-xl active:scale-95 transition-all hover:shadow-2xl flex items-center justify-center gap-2"
          >
            <GiftIcon className="w-5 h-5" aria-hidden="true" />
            Reclamar Recompensa
          </button>
        </div>
      )}

      {isClaimed && (
        <p className="text-center text-green-300 font-bold text-sm mt-4 relative z-10">
          ✓ Recompensa reclamada. ¡Mañana nuevo reto!
        </p>
      )}

      {/* Decorative blur blob */}
      <div
        className="absolute -right-16 -bottom-16 w-64 h-64 bg-accent opacity-5 blur-[80px] rounded-full pointer-events-none"
        aria-hidden="true"
      />
    </section>
  );
}
