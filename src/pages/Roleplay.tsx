import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import PageContainer from '@/components/layout/PageContainer';
import ModuleIntro from '@/components/ModuleIntro';
import AudioWaveform, { type WaveformState } from '@/components/AudioWaveform';
import { ArrowLeftIcon, ArrowPathIcon, BoltIcon, FaceSmileIcon, CheckBadgeIcon } from '@heroicons/react/24/outline';
import { DEFAULT_CLIENT_ACCENT, getClientAccent } from '@/features/roleplay/accents';
import type { ClientAccent } from '@/features/roleplay/accents';
import { createProceduralSession, dailyPolitenessSeed } from '@/features/roleplay/proceduralSession';
import type { SessionScenario } from '@/features/roleplay/proceduralSession';
import RoleplayAccentSelector from '@/features/roleplay/components/RoleplayAccentSelector';
import RoleplayPolitenessPanel from '@/features/roleplay/components/RoleplayPolitenessPanel';

import { useRoleplayController } from '@/features/roleplay/useRoleplayController';
import { resolveScenarioMeta, ROLEPLAY_DEPARTMENT_LABELS } from '@/features/roleplay/scenarios';
import type { RoleplayScenario } from '@/features/roleplay/schema';
import { CANONICAL_ROLEPLAY_SCENARIOS } from '@/features/roleplay/scenarios';
import { loadRoleplayCatalog } from '@/features/roleplay/catalog';
import RoleplayScenarioPicker from '@/features/roleplay/components/RoleplayScenarioPicker';
import RoleplayChat from '@/features/roleplay/components/RoleplayChat';
import RoleplayControls from '@/features/roleplay/components/RoleplayControls';
import RoleplayHint from '@/features/roleplay/components/RoleplayHint';
import RoleplayCorrection from '@/features/roleplay/components/RoleplayCorrection';
import RoleplayFeedbackCard from '@/features/roleplay/components/RoleplayFeedbackCard';

/** Pausa mínima del esqueleto de carga para que el cambio de estado sea perceptible. */
const GENERATION_SKELETON_MS = 450;

const Roleplay: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const isDailyChallenge = searchParams.get('reto') === 'cortesia';

  const [showIntro, setShowIntro] = useState(!isDailyChallenge);
  const [session, setSession] = useState<SessionScenario | null>(null);
  const [sessionId, setSessionId] = useState(0);
  const [accent, setAccent] = useState<ClientAccent>(DEFAULT_CLIENT_ACCENT);
  const [generating, setGenerating] = useState(false);
  const [catalog, setCatalog] = useState<RoleplayScenario[]>(CANONICAL_ROLEPLAY_SCENARIOS);
  const dailyLaunchedRef = useRef(false);

  const launchProcedural = useCallback(
    async (seed?: number) => {
      setGenerating(true);
      await new Promise((resolve) => setTimeout(resolve, GENERATION_SKELETON_MS));
      setSession(createProceduralSession(accent, seed));
      setSessionId((n) => n + 1);
      setGenerating(false);
    },
    [accent],
  );

  // «Reto de Cortesía del Día»: lanza un escenario procedural determinista por fecha.
  useEffect(() => {
    if (!isDailyChallenge || dailyLaunchedRef.current) return;
    dailyLaunchedRef.current = true;
    setSearchParams({}, { replace: true });
    void launchProcedural(dailyPolitenessSeed());
  }, [isDailyChallenge, launchProcedural, setSearchParams]);

  const setScenario = (scenario: RoleplayScenario | null) => {
    setSession(scenario ? { scenario } : null);
    setSessionId((n) => n + 1);
  };

  useEffect(() => {
    let cancelled = false;
    void loadRoleplayCatalog().then((loaded) => {
      if (!cancelled) setCatalog(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (showIntro) {
    return (
      <PageContainer>
        <ModuleIntro
          title="Roleplay Conversacional"
          description="Adopta el rol de trabajador y resuelve situaciones reales con un cliente que te responde por voz. Practica la espontaneidad en recepción, restaurante, bar, pisos y mantenimiento."
          icon={FaceSmileIcon}
          onStart={() => setShowIntro(false)}
          color="bg-accent"
          stats={[
            { label: 'Escenarios', value: catalog.length },
            { label: 'Turnos', value: '3–5' },
            { label: 'Voz', value: 'ASR + TTS' },
          ]}
        />
      </PageContainer>
    );
  }

  if (generating) {
    return (
      <PageContainer title="Roleplay Conversacional">
        <div
          className="max-w-2xl mx-auto py-16 text-center animate-fade-in"
          role="status"
          aria-live="polite"
          data-testid="scenario-skeleton"
        >
          <div className="w-12 h-12 mx-auto mb-6 rounded-full border-4 border-accent/30 border-t-accent animate-spin" aria-hidden="true" />
          <p className="text-primary font-black text-xl mb-6">Generando situación inesperada…</p>
          <div className="space-y-3 animate-pulse" aria-hidden="true">
            <div className="h-4 bg-surface/10 rounded-full w-3/4 mx-auto" />
            <div className="h-4 bg-surface/10 rounded-full w-1/2 mx-auto" />
            <div className="h-24 bg-surface/5 rounded-3xl" />
          </div>
        </div>
      </PageContainer>
    );
  }

  if (!session) {
    return (
      <PageContainer title="Roleplay Conversacional">
        <div className="max-w-4xl mx-auto animate-fade-in">
          <p className="text-tertiary text-center mb-6 max-w-xl mx-auto">
            Elige una situación. La IA adoptará el rol de cliente y evaluará tu capacidad de resolución.
          </p>
          <div className="mb-6 space-y-2">
            <p className="text-center text-[10px] uppercase tracking-widest font-black text-tertiary">
              Tipo de cliente / acento
            </p>
            <RoleplayAccentSelector value={accent} onChange={setAccent} />
          </div>
          <div className="text-center mb-10">
            <button
              type="button"
              onClick={() => void launchProcedural()}
              className="inline-flex items-center gap-2 bg-accent hover:brightness-110 text-on-accent font-black py-3 sm:py-4 px-6 sm:px-8 rounded-2xl shadow-xl transition-all active:scale-95 text-sm sm:text-base"
            >
              <BoltIcon className="w-5 h-5" aria-hidden="true" />
              Generar Situación Inesperada
            </button>
            <p className="text-xs text-tertiary mt-2">Práctica libre infinita: cada pulsación crea un escenario nuevo.</p>
          </div>
          <RoleplayScenarioPicker onSelect={setScenario} scenarios={catalog} />
        </div>
      </PageContainer>
    );
  }

  return (
    <RoleplaySession
      key={sessionId}
      session={session}
      accent={accent}
      onExit={() => setSession(null)}
      onRegenerate={session.procedural ? () => void launchProcedural() : undefined}
    />
  );
};

interface RoleplaySessionProps {
  session: SessionScenario;
  accent: ClientAccent;
  onExit: () => void;
  onRegenerate?: () => void;
}

function RoleplaySession({ session, accent, onExit, onRegenerate }: RoleplaySessionProps) {
  const { scenario } = session;
  const controllerOptions = useMemo(
    () => ({ systemPrompt: session.systemPrompt, accent }),
    [session.systemPrompt, accent],
  );
  const ctrl = useRoleplayController(scenario, controllerOptions);
  const meta = session.title
    ? { title: session.title }
    : resolveScenarioMeta(scenario.key);
  const accentDef = getClientAccent(accent);

  const waveformState: WaveformState = ctrl.isListening
    ? 'listening'
    : ctrl.phase === 'thinking'
      ? 'processing'
      : ctrl.phase === 'completed'
        ? 'result'
        : ctrl.error
          ? 'error'
          : ctrl.playbackWaveform;

  const header = (
    <div className="flex items-center gap-3 mb-2">
      <button
        onClick={() => { ctrl.actions.reset(); onExit(); }}
        className="p-2 rounded-xl text-tertiary hover:text-primary hover:bg-surface/5 transition-colors"
        aria-label="Volver a elegir escenario"
      >
        <ArrowLeftIcon className="w-6 h-6" aria-hidden="true" />
      </button>
      <div className="min-w-0 flex-1">
        <h2 className="text-base sm:text-lg font-black text-primary line-clamp-2 break-words leading-tight">{meta.title}</h2>
        <p className="text-[10px] uppercase tracking-widest text-accent-text font-bold">
          {ROLEPLAY_DEPARTMENT_LABELS[scenario.department]}
          {' · '}
          <span aria-label={`Acento: ${accentDef.label}`}>
            {accentDef.flag} {accentDef.label}
          </span>
        </p>
      </div>
    </div>
  );

  // 1. Escenario elegido, a la espera de empezar.
  if (ctrl.phase === 'idle') {
    return (
      <PageContainer title="Roleplay Conversacional">
        <div className="max-w-2xl mx-auto animate-fade-in text-center">
          {header}
          <div className="bg-surface/5 backdrop-blur-xl p-5 sm:p-10 rounded-2xl sm:rounded-[3rem] border border-border/15 shadow-2xl space-y-4 sm:space-y-6">
            <CheckBadgeIcon className="w-12 h-12 sm:w-16 sm:h-16 text-accent-text mx-auto" aria-hidden="true" />
            <h3 className="text-xl sm:text-2xl font-black text-primary">Tu objetivo</h3>
            <p className="text-tertiary text-base sm:text-lg leading-relaxed italic">{scenario.objective}</p>
            <p className="text-xs sm:text-sm text-secondary">
              El cliente va a hablarte por voz. Responde en inglés con naturalidad
              ({scenario.targetTurns.min}–{scenario.targetTurns.max} turnos).
            </p>
            <button
              onClick={() => void ctrl.actions.start()}
              className="w-full sm:w-auto bg-accent hover:brightness-110 text-on-accent font-black py-3.5 sm:py-4 px-6 sm:px-12 rounded-2xl shadow-xl transition-all active:scale-95 text-sm sm:text-base cursor-pointer"
            >
              COMENZAR CONVERSACIÓN
            </button>
          </div>
        </div>
      </PageContainer>
    );
  }

  // 2. Cargando modelo local.
  if (ctrl.phase === 'loading') {
    const pct = Math.round((ctrl.loadProgress?.progress ?? 0) * 100);
    return (
      <PageContainer title="Roleplay Conversacional">
        <div className="max-w-lg mx-auto text-center animate-fade-in py-16">
          {header}
          <p className="text-primary font-black text-xl mb-4">
            {ctrl.loadProgress?.text ?? 'Preparando el cliente…'}
          </p>
          <div
            className="w-full h-4 bg-surface/5 rounded-full overflow-hidden border border-border/10"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Carga del modelo de lenguaje"
          >
            <div
              className="h-full bg-accent transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-tertiary text-sm mt-3">{pct}%</p>
        </div>
      </PageContainer>
    );
  }

  // 3. Sesión terminada: resumen del resultado.
  if (ctrl.phase === 'completed') {
    const r = ctrl.result;
    return (
      <PageContainer title="Roleplay Conversacional">
        <div className="max-w-2xl mx-auto animate-fade-in text-center">
          {header}
          <div className="bg-surface/5 backdrop-blur-xl p-5 sm:p-10 rounded-2xl sm:rounded-[3rem] border border-border/15 shadow-2xl space-y-4 sm:space-y-6">
            <CheckBadgeIcon
              className={`w-12 h-12 sm:w-16 sm:h-16 mx-auto ${r?.objectiveMet ? 'text-success' : 'text-tertiary'}`}
              aria-hidden="true"
            />
            <h3 className="text-xl sm:text-2xl font-black text-primary">
              {r?.objectiveMet ? '¡Situación resuelta!' : 'Sesión completada'}
            </h3>
            <p className="text-tertiary text-sm sm:text-base">
              {r?.objectiveMet
                ? 'Conseguiste los términos clave y resolviste la situación.'
                : 'Se alcanzó el número máximo de turnos. Repasa el vocabulario e inténtalo de nuevo.'}
            </p>
            {ctrl.politeness && <RoleplayPolitenessPanel evaluation={ctrl.politeness} />}
            {ctrl.feedbackSummary && (
              <RoleplayFeedbackCard summary={ctrl.feedbackSummary} />
            )}
            <p className="text-sm text-secondary" role="status">
              {r?.turnsUsed ?? 0} / {r?.maxTurns ?? scenario.targetTurns.max} turnos
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
              <button
                onClick={() => void ctrl.actions.reset()}
                className="w-full sm:w-auto bg-accent hover:brightness-110 text-on-accent font-black py-3 px-6 rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer"
              >
                <ArrowPathIcon className="w-5 h-5" aria-hidden="true" />
                REINTENTAR
              </button>
              <button
                onClick={onExit}
                className="w-full sm:w-auto bg-surface/5 hover:bg-surface/10 text-primary font-bold py-3 px-6 rounded-2xl border border-border/15 transition-all active:scale-95 text-sm sm:text-base cursor-pointer"
              >
                OTRO ESCENARIO
              </button>
              {onRegenerate && (
                <button
                  onClick={onRegenerate}
                  className="w-full sm:w-auto bg-surface/5 hover:bg-surface/10 text-primary font-bold py-3 px-6 rounded-2xl border border-border/15 transition-all active:scale-95 flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer"
                >
                  <BoltIcon className="w-5 h-5" aria-hidden="true" />
                  NUEVA SITUACIÓN
                </button>
              )}
            </div>
          </div>
        </div>
      </PageContainer>
    );
  }

  // 4. Conversación en curso (prompting / listening / thinking) o error.
  return (
    <PageContainer title="Roleplay Conversacional">
      <div className="max-w-2xl mx-auto flex flex-col animate-fade-in">
        {header}

        {ctrl.error && (
          <div
            className="bg-error/15 border border-error/25 text-error rounded-2xl p-4 text-sm mb-4"
            role="alert"
          >
            {ctrl.error}
            <button
              onClick={() => void ctrl.actions.reset()}
              className="ml-3 underline hover:text-primary"
            >
              Reintentar
            </button>
          </div>
        )}

        <div className="bg-surface/5 backdrop-blur-xl rounded-3xl sm:rounded-[2.5rem] border border-border/15 shadow-2xl p-4 sm:p-6 flex flex-col">
          <RoleplayChat
            turns={ctrl.turns}
            clientLabel="Cliente"
            userLabel="Tú"
            typing={ctrl.phase === 'thinking'}
          />

          {ctrl.politeness &&
            (ctrl.phase === 'thinking' || ctrl.phase === 'prompting') && (
              <div className="mb-4">
                <RoleplayPolitenessPanel evaluation={ctrl.politeness} />
              </div>
            )}

          {ctrl.turnFeedback &&
            (ctrl.phase === 'thinking' || ctrl.phase === 'prompting') && (
              <div className="mb-4">
                <RoleplayCorrection feedback={ctrl.turnFeedback} />
              </div>
            )}

          <AudioWaveform state={waveformState} height={48} className="mb-4" />

          {ctrl.hintVisible && ctrl.hint && (
            <div className="mb-3">
              <RoleplayHint hint={ctrl.hint} onDismiss={ctrl.actions.dismissHint} />
            </div>
          )}

          <RoleplayControls
            isListening={ctrl.isListening}
            asrSupported={ctrl.asrSupported}
            disabled={ctrl.phase === 'thinking'}
            onToggleListening={ctrl.actions.toggleListening}
            onSubmitText={ctrl.actions.submitText}
          />
        </div>
      </div>
    </PageContainer>
  );
}

export default Roleplay;