/**
 * Modo «Rush Hour» (PM-02): 5 comandas/situaciones imprevistas en 2 minutos.
 *
 * Combina el generador acústico ambiental (`useAmbientAudio`) con el motor
 * contrarreloj (`features/rushhour/rushHour`). Cada respuesta se evalúa en
 * velocidad + cortesía hostelera, y al final se presenta un resumen
 * consolidado.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import PageContainer from '@/components/layout/PageContainer';
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  BoltIcon,
  CheckBadgeIcon,
  ClockIcon,
  SpeakerWaveIcon,
} from '@heroicons/react/24/outline';
import { useAmbientAudio } from '@/hooks/useAmbientAudio';
import {
  AMBIENT_LEVEL_ORDER,
  AMBIENT_LEVEL_LABELS,
} from '@/services/audio/ambientAudio';
import type { AmbientLevel } from '@/services/audio/ambientAudio';
import {
  RUSH_HOUR_SITUATIONS,
  RUSH_HOUR_TIME_LIMIT_MS,
  RUSH_HOUR_TOTAL_SITUATIONS,
  remainingMs,
  rushHourGrade,
  scoreRushHourAnswer,
  summarizeRushHour,
} from '@/features/rushhour';
import type { RushHourAnswerScore } from '@/features/rushhour';

type RushHourPhase = 'ready' | 'running' | 'finished';

/** Formatea ms restantes como `m:ss`. */
function formatTime(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const RushHour: React.FC = () => {
  const ambient = useAmbientAudio('medium');
  const [phase, setPhase] = useState<RushHourPhase>('ready');
  const [index, setIndex] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [answers, setAnswers] = useState<RushHourAnswerScore[]>([]);
  const [input, setInput] = useState('');

  const deadlineRef = useRef(0);
  const presentedAtRef = useRef(0);

  // Tic del contador (solo durante la ronda).
  useEffect(() => {
    if (phase !== 'running') return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [phase]);

  const finishRound = useCallback(() => {
    setPhase('finished');
    ambient.stop();
  }, [ambient.stop]);

  const remaining = phase === 'running' ? remainingMs(deadlineRef.current, now) : RUSH_HOUR_TIME_LIMIT_MS;

  // Vencimiento por tiempo: finaliza automáticamente.
  useEffect(() => {
    if (phase === 'running' && remaining <= 0) finishRound();
  }, [phase, remaining, finishRound]);

  const startRound = () => {
    setAnswers([]);
    setIndex(0);
    setInput('');
    presentedAtRef.current = Date.now();
    deadlineRef.current = Date.now() + RUSH_HOUR_TIME_LIMIT_MS;
    setNow(Date.now());
    setPhase('running');
    if (ambient.level !== 'off') void ambient.start();
  };

  const submit = () => {
    const text = input.trim();
    if (!text || phase !== 'running') return;

    const elapsed = Date.now() - presentedAtRef.current;
    const score = scoreRushHourAnswer({
      situationId: RUSH_HOUR_SITUATIONS[index].id,
      elapsedMs: elapsed,
      text,
    });
    const next = [...answers, score];
    setAnswers(next);
    setInput('');

    if (index + 1 >= RUSH_HOUR_TOTAL_SITUATIONS) {
      finishRound();
    } else {
      setIndex(index + 1);
      presentedAtRef.current = Date.now();
    }
  };

  const summary = useMemo(() => summarizeRushHour(answers), [answers]);

  const situationById = useMemo(
    () => new Map(RUSH_HOUR_SITUATIONS.map((s) => [s.id, s])),
    [],
  );

  /* ------------------------------- ready -------------------------------- */
  if (phase === 'ready') {
    return (
      <PageContainer title="Modo Rush Hour">
        <div className="max-w-2xl mx-auto animate-fade-in text-center" data-testid="rush-hour-intro">
          <div className="bg-surface/5 backdrop-blur-xl p-5 sm:p-10 rounded-2xl sm:rounded-[3rem] border border-border/15 shadow-2xl space-y-4 sm:space-y-6">
            <BoltIcon className="w-12 h-12 sm:w-16 sm:h-16 text-accent-text mx-auto" aria-hidden="true" />
            <h2 className="text-xl sm:text-3xl font-black text-primary">Hora Punta</h2>
            <p className="text-tertiary text-sm sm:text-base leading-relaxed max-w-xl mx-auto">
              Cinco situaciones imprevistas en pleno servicio. Responde en inglés a cada una
              antes de que se agote el reloj: se valora tu <strong>velocidad</strong> y tu{' '}
              <strong>cortesía hostelera</strong>.
            </p>
            <div className="flex items-center justify-center gap-3 text-sm text-secondary">
              <ClockIcon className="w-5 h-5 text-accent-text" aria-hidden="true" />
              <span>2 minutos</span>
              <span aria-hidden="true">·</span>
              <span>{RUSH_HOUR_TOTAL_SITUATIONS} comandas</span>
            </div>

            {ambient.supported && <AmbientControl ambient={ambient} />}

            <button
              type="button"
              onClick={startRound}
              className="w-full sm:w-auto bg-accent hover:brightness-110 text-on-accent font-black py-3.5 sm:py-4 px-6 sm:px-12 rounded-2xl shadow-xl transition-all active:scale-95 text-sm sm:text-base cursor-pointer"
            >
              COMENZAR RUSH HOUR
            </button>
          </div>
        </div>
      </PageContainer>
    );
  }

  /* ------------------------------ running ------------------------------- */
  if (phase === 'running') {
    const situation = RUSH_HOUR_SITUATIONS[index];
    return (
      <PageContainer title="Modo Rush Hour">
        <div className="max-w-2xl mx-auto animate-fade-in flex flex-col gap-4">
          {/* Cabecera: contador + progreso + ambiente */}
          <div className="flex items-center justify-between gap-3">
            <Link
              to="/dashboard"
              className="p-2 rounded-xl text-tertiary hover:text-primary hover:bg-surface/5 transition-colors"
              aria-label="Salir del modo rush hour"
            >
              <ArrowLeftIcon className="w-6 h-6" aria-hidden="true" />
            </Link>
            <div
              className={`px-4 py-2 rounded-2xl font-black text-lg tabular-nums ${remaining <= 10_000 ? 'bg-error/15 text-error' : 'bg-surface/10 text-primary'}`}
              role="timer"
              aria-live="off"
              data-testid="rush-hour-timer"
            >
              {formatTime(remaining)}
            </div>
            <div className="text-sm font-bold text-tertiary tabular-nums">
              {index + 1}/{RUSH_HOUR_TOTAL_SITUATIONS}
            </div>
          </div>

          {ambient.supported && <AmbientControl ambient={ambient} compact />}

          {/* Situación actual */}
          <div className="bg-surface/5 backdrop-blur-xl rounded-3xl p-5 sm:p-6 border border-border/15 shadow-2xl">
            <p className="text-[10px] uppercase tracking-widest font-black text-accent-text mb-2">
              {situation.departmentLabel}
            </p>
            <p className="text-primary text-lg sm:text-xl font-black leading-snug" data-testid="rush-hour-situation">
              {situation.prompt}
            </p>
            <p className="text-tertiary text-xs sm:text-sm mt-3 leading-relaxed">
              <span className="font-bold text-secondary">Objetivo:</span> {situation.instruction}
            </p>
          </div>

          {/* Entrada */}
          <div className="bg-surface/5 backdrop-blur-xl rounded-3xl p-4 sm:p-5 border border-border/15 shadow-2xl">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submit();
              }}
              placeholder="Escribe tu respuesta en inglés…"
              className="w-full bg-background/20 border border-border/10 rounded-2xl px-4 py-3 text-primary placeholder:text-tertiary outline-none focus:border-accent/50 transition-colors"
              data-testid="rush-hour-answer-input"
              aria-label="Tu respuesta"
              autoFocus
            />
            <button
              type="button"
              onClick={submit}
              disabled={!input.trim()}
              className="mt-3 w-full bg-accent hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed text-on-accent font-black py-3 rounded-2xl transition-all active:scale-95 cursor-pointer"
              data-testid="rush-hour-submit"
            >
              Responder
            </button>
          </div>
        </div>
      </PageContainer>
    );
  }

  /* ------------------------------ finished ------------------------------ */
  const grade = rushHourGrade(summary.averageCombined);
  return (
    <PageContainer title="Modo Rush Hour">
      <div className="max-w-2xl mx-auto animate-fade-in text-center" data-testid="rush-hour-summary">
        <div className="bg-surface/5 backdrop-blur-xl p-5 sm:p-8 rounded-2xl sm:rounded-[3rem] border border-border/15 shadow-2xl space-y-4 sm:space-y-6">
          <CheckBadgeIcon className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-accent-text" aria-hidden="true" />
          <h2 className="text-xl sm:text-3xl font-black text-primary">
            {summary.completed ? '¡Hora punta superada!' : 'Tiempo agotado'}
          </h2>
          <p className="text-tertiary text-sm sm:text-base">
            Respondiste {summary.answeredCount} de {summary.totalCount} situaciones en un
            entorno con ruido de sala.
          </p>

          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            <ScoreTile label="Velocidad" value={summary.averageSpeed} />
            <ScoreTile label="Cortesía" value={summary.averageCourtesy} />
            <ScoreTile label="Combinada" value={summary.averageCombined} />
          </div>
          <p className="text-secondary font-black text-lg sm:text-xl">{grade}</p>

          <ul className="text-left space-y-2" aria-label="Resultado por situación">
            {summary.scores.map((score) => {
              const situation = situationById.get(score.situationId);
              return (
                <li
                  key={score.situationId}
                  className="flex items-center justify-between gap-3 bg-background/10 border border-border/10 rounded-2xl px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-primary text-sm font-bold truncate">
                      {situation?.departmentLabel ?? score.situationId}
                    </p>
                    <p className="text-tertiary text-xs truncate">{score.politeness.level}</p>
                  </div>
                  <span className="text-primary font-black text-sm tabular-nums shrink-0">
                    {score.combinedScore}
                  </span>
                </li>
              );
            })}
          </ul>

          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={startRound}
              className="w-full sm:w-auto bg-accent hover:brightness-110 text-on-accent font-black py-3 px-6 rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer"
            >
              <ArrowPathIcon className="w-5 h-5" aria-hidden="true" />
              REPETIR
            </button>
            <Link
              to="/dashboard"
              className="w-full sm:w-auto bg-surface/5 hover:bg-surface/10 text-primary font-bold py-3 px-6 rounded-2xl border border-border/15 transition-all active:scale-95 text-sm sm:text-base text-center"
            >
              VOLVER AL DASHBOARD
            </Link>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

/* ------------------------------------------------------------------------- */

function ScoreTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-background/20 border border-border/10 rounded-2xl p-3 sm:p-4">
      <p className="text-[10px] uppercase tracking-widest text-tertiary font-bold mb-1">{label}</p>
      <p className="text-primary font-black text-2xl sm:text-3xl tabular-nums">{value}</p>
    </div>
  );
}

interface AmbientControlProps {
  ambient: ReturnType<typeof useAmbientAudio>;
  /** Presentación compacta (durante la ronda). */
  compact?: boolean;
}

function AmbientControl({ ambient, compact = false }: AmbientControlProps) {
  const handleLevel = (level: AmbientLevel) => {
    ambient.setLevel(level);
    if (level === 'off') ambient.stop();
    else if (!ambient.running) void ambient.start();
  };

  return (
    <div
      className={`flex flex-wrap items-center justify-center gap-2 ${compact ? '' : 'mt-2'}`}
      role="radiogroup"
      aria-label="Volumen del ambiente de sala"
    >
      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest font-black text-tertiary">
        <SpeakerWaveIcon className="w-4 h-4" aria-hidden="true" />
        Ambiente
      </span>
      {AMBIENT_LEVEL_ORDER.map((level) => {
        return (
          <button
            key={level}
            type="button"
            role="radio"
            aria-checked={ambient.level === level}
            onClick={() => handleLevel(level)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
              ambient.level === level
                ? 'bg-accent text-on-accent border-transparent'
                : 'bg-surface/5 text-secondary border-border/15 hover:bg-surface/10'
            }`}
          >
            {AMBIENT_LEVEL_LABELS[level]}
          </button>
        );
      })}
    </div>
  );
}

export default RushHour;