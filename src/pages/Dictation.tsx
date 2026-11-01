import React, { useState, useEffect } from 'react';
import { useDictationLogic } from '@/features/dictation/hooks/useDictationLogic';
import AudioWaveform, { type WaveformState } from '@/components/AudioWaveform';
import DictationPlayer from '@/features/dictation/components/DictationPlayer';
import DictationInput from '@/features/dictation/components/DictationInput';
import DictationFeedback from '@/features/dictation/components/DictationFeedback';
import VoiceSettings from '@/components/VoiceSettings';
import AudioStatusRegion from '@/components/AudioStatusRegion';
import PageContainer from '@/components/layout/PageContainer';
import CollapsibleSection from '@/components/CollapsibleSection';
import ModuleIntro from '@/components/ModuleIntro';
import {
  MicrophoneIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

const Dictation: React.FC = () => {
  const [showWelcome, setShowWelcome] = useState(true);
  const { state, actions } = useDictationLogic();
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const handlePlay = async () => {
    setIsPlayingAudio(true);
    try {
      await actions.handlePlayAudio();
    } finally {
      setIsPlayingAudio(false);
    }
  };

  const waveformState: WaveformState = state.isListening
    ? 'recording'
    : isPlayingAudio
      ? 'playing'
      : state.feedback
        ? 'result'
        : 'idle';

  // Initialize first phrase when welcome is dismissed
  useEffect(() => {
    if (!showWelcome && !state.currentPhrase) {
      actions.selectNewPhrase();
    }
  }, [showWelcome, state.currentPhrase, actions]);

  if (showWelcome) {
    return (
      <PageContainer>
        <ModuleIntro
          title="Módulo de Dictado"
          description="Entrena tu oído y tu escritura al mismo tiempo. Escucha la frase y escríbela sin errores para dominar la comunicación escrita."
          icon={MicrophoneIcon}
          onStart={() => setShowWelcome(false)}
          stats={[
            { label: 'Enfoque', value: 'Listening' },
            { label: 'Desafío', value: 'Escritura' },
            { label: 'Racha', value: '0' }
          ]}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Dictado Interactivo">
      <AudioStatusRegion
        status={waveformState}
        isCorrect={state.feedback?.isCorrect}
      />
      <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
        <div className="bg-surface/10 backdrop-blur-2xl p-10 rounded-[3rem] shadow-2xl border border-border/20 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-accent opacity-5 blur-3xl rounded-full" aria-hidden="true"></div>

          <DictationPlayer onPlay={handlePlay} />
          <AudioWaveform state={waveformState} className="mb-8" />

          <DictationInput 
            value={state.userAnswer}
            isListening={state.isListening}
            transcript={state.transcript}
            browserSupportsSpeechRecognition={state.browserSupportsSpeechRecognition}
            onChange={(val) => { actions.cancelSpeech(); actions.setUserAnswer(val); }}
            onCheck={actions.handleCheckAnswer}
            onToggleListening={() => {
              actions.cancelSpeech();
              state.isListening ? actions.stopListening() : actions.startListening();
            }}
          />

          <DictationFeedback 
            feedback={state.feedback}
            correctAnswer={state.correctAnswer}
            showTranslation={state.showTranslation}
            currentPhrase={state.currentPhrase}
          />
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button
            onClick={() => { actions.cancelSpeech(); actions.selectNewPhrase(); }}
            className="bg-surface/5 hover:bg-surface/10 text-primary font-black py-4 px-10 rounded-2xl transition-all active:scale-95 border border-border/10 flex items-center justify-center gap-3"
            aria-label="Cargar siguiente frase aleatoria"
          >
            SIGUIENTE FRASE
            <ArrowRightIcon className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="pt-8">
          <CollapsibleSection title="Personalización de Audio">
            <VoiceSettings
              settings={state.phraseSettings}
              onSettingChange={actions.setPhraseSetting}
              showTitle={false}
            />
          </CollapsibleSection>
        </div>
      </div>
    </PageContainer>
  );
};

export default Dictation;
