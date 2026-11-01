import React, { useState } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import ModuleIntro from '@/components/ModuleIntro';
import AudioWaveform, { type WaveformState } from '@/components/AudioWaveform';
import { ArrowLeftIcon, ArrowPathIcon, FaceSmileIcon, CheckBadgeIcon } from '@heroicons/react/24/outline';

import { useRoleplayController } from '@/features/roleplay/useRoleplayController';
import { resolveScenarioMeta, ROLEPLAY_DEPARTMENT_LABELS } from '@/features/roleplay/scenarios';
import type { RoleplayScenario } from '@/features/roleplay/schema';
import RoleplayScenarioPicker from '@/features/roleplay/components/RoleplayScenarioPicker';
import RoleplayChat from '@/features/roleplay/components/RoleplayChat';
import RoleplayControls from '@/features/roleplay/components/RoleplayControls';

const Roleplay: React.FC = () => {
  const [showIntro, setShowIntro] = useState(true);
  const [scenario, setScenario] = useState<RoleplayScenario | null>(null);

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
            { label: 'Escenarios', value: 5 },
            { label: 'Turnos', value: '3–5' },
            { label: 'Voz', value: 'ASR + TTS' },
          ]}
        />
      </PageContainer>
    );
  }

  if (!scenario) {
    return (
      <PageContainer title="Roleplay Conversacional">
        <div className="max-w-4xl mx-auto animate-fade-in">
          <p className="text-tertiary text-center mb-8 max-w-xl mx-auto">
            Elige una situación. La IA adoptará el rol de cliente y evaluará tu capacidad de resolución.
          </p>
          <RoleplayScenarioPicker onSelect={setScenario} />
        </div>
      </PageContainer>
    );
  }

  return (
    <RoleplaySession
      key={scenario.key}
      scenario={scenario}
      onExit={() => setScenario(null)}
    />
  );
};

interface RoleplaySessionProps {
  scenario: RoleplayScenario;
  onExit: () => void;
}

function RoleplaySession({ scenario, onExit }: RoleplaySessionProps) {
  const ctrl = useRoleplayController(scenario);
  const meta = resolveScenarioMeta(scenario.key);

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
      <div className="min-w-0">
        <h2 className="text-lg font-black text-primary truncate">{meta.title}</h2>
        <p className="text-[10px] uppercase tracking-widest text-accent font-bold">
          {ROLEPLAY_DEPARTMENT_LABELS[scenario.department]}
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
          <div className="bg-surface/5 backdrop-blur-xl p-10 rounded-[3rem] border border-border/15 shadow-2xl space-y-6">
            <CheckBadgeIcon className="w-16 h-16 text-accent mx-auto" aria-hidden="true" />
            <h3 className="text-2xl font-black text-primary">Tu objetivo</h3>
            <p className="text-tertiary text-lg leading-relaxed italic">{scenario.objective}</p>
            <p className="text-sm text-secondary">
              El cliente va a hablarte por voz. Responde en inglés con naturalidad
              ({scenario.targetTurns.min}–{scenario.targetTurns.max} turnos).
            </p>
            <button
              onClick={() => void ctrl.actions.start()}
              className="bg-accent hover:brightness-110 text-on-accent font-black py-4 px-12 rounded-2xl shadow-xl transition-all active:scale-95"
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
          <div className="bg-surface/5 backdrop-blur-xl p-10 rounded-[3rem] border border-border/15 shadow-2xl space-y-6">
            <CheckBadgeIcon
              className={`w-16 h-16 mx-auto ${r?.objectiveMet ? 'text-success' : 'text-tertiary'}`}
              aria-hidden="true"
            />
            <h3 className="text-2xl font-black text-primary">
              {r?.objectiveMet ? '¡Situación resuelta!' : 'Sesión completada'}
            </h3>
            <p className="text-tertiary">
              {r?.objectiveMet
                ? 'Conseguiste los términos clave y resolviste la situación.'
                : 'Se alcanzó el número máximo de turnos. Repasa el vocabulario e inténtalo de nuevo.'}
            </p>
            {r && r.foundVocabulary.length > 0 && (
              <div className="space-y-2 max-w-md mx-auto text-left">
                <p className="text-xs uppercase tracking-widest text-secondary font-bold">
                  Vocabulario utilizado
                </p>
                <div className="flex flex-wrap gap-2">
                  {r.foundVocabulary.map((term) => (
                    <span
                      key={term}
                      className="bg-success/15 text-success text-xs font-bold px-3 py-1 rounded-full border border-success/20"
                    >
                      {term}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <p className="text-sm text-secondary" role="status">
              {r?.turnsUsed ?? 0} / {r?.maxTurns ?? scenario.targetTurns.max} turnos
            </p>
            <div className="flex justify-center gap-4 pt-2">
              <button
                onClick={() => void ctrl.actions.reset()}
                className="bg-accent hover:brightness-110 text-on-accent font-black py-3 px-8 rounded-2xl transition-all active:scale-95 flex items-center gap-2"
              >
                <ArrowPathIcon className="w-5 h-5" aria-hidden="true" />
                REINTENTAR
              </button>
              <button
                onClick={onExit}
                className="bg-surface/5 hover:bg-surface/10 text-primary font-bold py-3 px-8 rounded-2xl border border-border/15 transition-all active:scale-95"
              >
                OTRO ESCENARIO
              </button>
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

        <div className="bg-surface/5 backdrop-blur-xl rounded-[2.5rem] border border-border/15 shadow-2xl p-6 flex flex-col">
          <RoleplayChat
            turns={ctrl.turns}
            clientLabel="Cliente"
            userLabel="Tú"
            typing={ctrl.phase === 'thinking'}
          />

          <AudioWaveform state={waveformState} height={48} className="mb-4" />

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