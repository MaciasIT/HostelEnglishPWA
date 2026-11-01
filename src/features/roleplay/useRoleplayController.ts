/**
 * Orquestador React del roleplay (FC-03 + FC-04).
 *
 * Conecta las tres piezas del contrato de integración:
 *  - `useLocalLLM` (FC-07): motor SLM on-device para la respuesta del cliente.
 *  - `useAudioManager` (FC-01): TTS escalonado para la voz del cliente.
 *  - `useSpeechRecognition`: ASR para la entrada por voz del alumno.
 *
 * Orquesta la máquina de estados (`stateMachine`) y el verificador de objetivo
 * (`goalChecker`) con los efectos asíncronos (carga, generación, síntesis).
 *
 * FC-04 añade el motor de asistencia en tiempo real:
 *  - detección de inactividad (> 8 s) con pista discreta (`hintService`);
 *  - corrección de cortesía tras cada turno (`courtesyEvaluator`);
 *  - resumen de feedback al completar (`feedbackSummary`).
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import { useLocalLLM } from '@/hooks/useLocalLLM';
import type { LLMStatus } from '@/hooks/useLocalLLM';
import { useAudioManager } from '@/hooks/useAudioManager';
import useSpeechRecognition from '@/hooks/useSpeechRecognition';
import { buildRoleplayMessages } from '@/services/llm/roleplayPromptBuilder';
import type { LLMChatMessage, LLMLoadProgress } from '@/services/llm/llmTypes';
import type { WaveformState } from '@/components/AudioWaveform';

import { checkObjective, checkObjectiveAcrossTurns } from './goalChecker';
import { shouldComplete } from './stateMachine';
import type { RoleplayPhase, RoleplayResult, RoleplayTurn } from './stateMachine';
import type { RoleplayScenario } from './schema';
import { evaluatePoliteness } from './courtesyEvaluator';
import type { CourtesyEvaluation } from './courtesyEvaluator';
import { buildHint, INACTIVITY_HINT_THRESHOLD_MS } from './hintService';
import type { RoleplayHint } from './hintService';
import { buildFeedbackSummary } from './feedbackSummary';
import type { FeedbackSummary } from './feedbackSummary';

export interface RoleplayController {
  phase: RoleplayPhase;
  turns: RoleplayTurn[];
  result: RoleplayResult | null;
  error: string | null;
  llmStatus: LLMStatus;
  loadProgress: LLMLoadProgress | null;
  playbackWaveform: WaveformState;
  transcript: string;
  isListening: boolean;
  asrSupported: boolean;
  asrError: string | null;
  /** Pista sugerida tras inactividad; `null` si aún no se ha generado. */
  hint: RoleplayHint | null;
  /** Si la pista debe mostrarse (inactividad detectada y no descartada). */
  hintVisible: boolean;
  /** Corrección de cortesía del último turno del alumno. */
  turnFeedback: CourtesyEvaluation | null;
  /** Resumen de feedback, disponible al completar la sesión. */
  feedbackSummary: FeedbackSummary | null;
  actions: {
    start: () => Promise<void>;
    toggleListening: () => void;
    submitText: (text: string) => void;
    dismissHint: () => void;
    reset: () => Promise<void>;
  };
}

/** Construye el historial LLM: system + línea de apertura (asistente). */
function buildInitialMessages(scenario: RoleplayScenario): LLMChatMessage[] {
  return buildRoleplayMessages(
    scenario.key,
    { level: scenario.level, language: 'en', allowHints: true },
    scenario.openingLine,
  );
}

export function useRoleplayController(scenario: RoleplayScenario): RoleplayController {
  const {
    status: llmStatus,
    progress: loadProgress,
    load,
    generate,
    reset: resetLLM,
  } = useLocalLLM({ contextWindowSize: 1024 });

  const { speak, cancel, waveformState: playbackWaveform } = useAudioManager();
  const asr = useSpeechRecognition();

  const [phase, setPhase] = useState<RoleplayPhase>('idle');
  const [turns, setTurns] = useState<RoleplayTurn[]>([]);
  const [result, setResult] = useState<RoleplayResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Estado del motor de asistencia (FC-04).
  const [hint, setHint] = useState<RoleplayHint | null>(null);
  const [hintVisible, setHintVisible] = useState(false);
  const [turnFeedback, setTurnFeedback] = useState<CourtesyEvaluation | null>(null);
  const [feedbackSummary, setFeedbackSummary] = useState<FeedbackSummary | null>(null);

  // Fuente única del historial que se envía al LLM.
  const messagesRef = useRef<LLMChatMessage[]>([]);
  const userTurnCountRef = useRef(0);
  const scenarioRef = useRef(scenario);
  // Turnos del alumno ya emitidos, para el cálculo acumulado de feedback.
  const userTurnsRef = useRef<string[]>([]);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    scenarioRef.current = scenario;
  }, [scenario]);

  useEffect(() => {
    return () => {
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    };
  }, []);

  const start = useCallback(async () => {
    setError(null);
    setResult(null);
    setTurns([]);
    setHint(null);
    setHintVisible(false);
    setTurnFeedback(null);
    setFeedbackSummary(null);
    userTurnCountRef.current = 0;
    userTurnsRef.current = [];
    messagesRef.current = buildInitialMessages(scenarioRef.current);
    setPhase('loading');

    try {
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el modelo local.');
      setPhase('error');
      return;
    }

    setTurns([{ role: 'client', text: scenarioRef.current.openingLine }]);
    setPhase('prompting');
    void speak(scenarioRef.current.openingLine, { language: 'en' });
  }, [load, speak]);

  const handleUserTurn = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || phase === 'completed') return;

      // El alumno ha respondido: se descarta cualquier pista pendiente (FC-04).
      setHintVisible(false);
      setPhase('thinking');
      setTurns((prev) => [...prev, { role: 'user', text: trimmed }]);
      messagesRef.current.push({ role: 'user', content: trimmed });
      userTurnCountRef.current += 1;
      userTurnsRef.current.push(trimmed);

      // Corrección de cortesía del turno (FC-04), siempre que haya algo que señalar.
      const courtesy = evaluatePoliteness(trimmed);
      setTurnFeedback(courtesy.issues.length > 0 ? courtesy : null);

      const scenarioData = scenarioRef.current;
      const goal = checkObjective(scenarioData, trimmed);
      const done = shouldComplete({
        objectiveMet: goal.met,
        userTurnCount: userTurnCountRef.current,
        minTurns: scenarioData.targetTurns.min,
        maxTurns: scenarioData.targetTurns.max,
      });

      if (done) {
        // Resumen acumulado de feedback de toda la sesión (FC-04).
        const cumulativeGoal = checkObjectiveAcrossTurns(
          scenarioData,
          userTurnsRef.current,
        );
        setFeedbackSummary(
          buildFeedbackSummary({
            userTurns: userTurnsRef.current,
            goal: cumulativeGoal,
          }),
        );
        setResult({
          objectiveMet: goal.met,
          turnsUsed: userTurnCountRef.current,
          maxTurns: scenarioData.targetTurns.max,
          foundVocabulary: goal.foundVocabulary,
        });
        setPhase('completed');
        return;
      }

      try {
        const replyResult = await generate(
          messagesRef.current,
          {},
          { maxTokens: 256, temperature: 0.7 },
        );
        const reply = replyResult.fullText.trim();
        setTurns((prev) => [...prev, { role: 'client', text: reply }]);
        messagesRef.current.push({ role: 'assistant', content: reply });
        setPhase('prompting');
        void speak(reply, { language: 'en' });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'La IA no pudo responder.');
        setPhase('error');
      }
    },
    [phase, generate, speak],
  );

  // Consume la transcripción final del ASR como un turno del alumno.
  const lastTranscriptRef = useRef('');
  useEffect(() => {
    // Solo durante la conversación (esperando entrada del alumno), nunca en idle.
    if (phase !== 'prompting' && phase !== 'listening') return;
    const { isListening, transcript } = asr;
    if (!isListening && transcript.trim() && transcript !== lastTranscriptRef.current) {
      lastTranscriptRef.current = transcript;
      void handleUserTurn(transcript);
    }
    if (isListening) {
      lastTranscriptRef.current = '';
    }
  }, [asr, phase, handleUserTurn]);

  // Detección de inactividad (FC-04): tras >8 s esperando respuesta y sin estar
  // grabando, se ofrece una pista discreta.
  useEffect(() => {
    const isWaiting = phase === 'prompting' && !asr.isListening;
    if (!isWaiting) {
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
      return;
    }
    hintTimerRef.current = setTimeout(() => {
      setHint(buildHint(scenarioRef.current, userTurnsRef.current));
      setHintVisible(true);
    }, INACTIVITY_HINT_THRESHOLD_MS);
    return () => {
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    };
  }, [phase, asr.isListening, turns.length]);

  const toggleListening = useCallback(() => {
    if (asr.isListening) asr.stopListening();
    else asr.startListening();
  }, [asr]);

  const submitText = useCallback(
    (text: string) => {
      void handleUserTurn(text);
    },
    [handleUserTurn],
  );

  const dismissHint = useCallback(() => {
    setHintVisible(false);
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
  }, []);

  const reset = useCallback(async () => {
    cancel();
    await resetLLM();
    messagesRef.current = [];
    userTurnCountRef.current = 0;
    userTurnsRef.current = [];
    lastTranscriptRef.current = '';
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    setTurns([]);
    setResult(null);
    setError(null);
    setHint(null);
    setHintVisible(false);
    setTurnFeedback(null);
    setFeedbackSummary(null);
    setPhase('idle');
  }, [cancel, resetLLM]);

  return {
    phase,
    turns,
    result,
    error,
    llmStatus,
    loadProgress,
    playbackWaveform,
    transcript: asr.transcript,
    isListening: asr.isListening,
    asrSupported: asr.browserSupportsSpeechRecognition,
    asrError: asr.error,
    hint,
    hintVisible,
    turnFeedback,
    feedbackSummary,
    actions: { start, toggleListening, submitText, dismissHint, reset },
  };
}