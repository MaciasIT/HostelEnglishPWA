import { useConversationLogic } from '../hooks/useConversationLogic';
import ConversationBubble from './ConversationBubble';
import CollapsibleSection from '@/components/CollapsibleSection';
import VoiceSettings from '@/components/VoiceSettings';
import { Conversation } from '@/store/useAppStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeftIcon,
  PlayIcon,
  PauseIcon,
  UserCircleIcon,
  ViewColumnsIcon,
  Bars3BottomLeftIcon
} from '@heroicons/react/24/outline';

interface ConversationUIProps {
  conversation: Conversation;
  onBack: () => void;
  onConversationEnd: () => void;
}

export default function ConversationUI({ conversation, onBack, onConversationEnd }: ConversationUIProps) {
  const { state, actions } = useConversationLogic(conversation, onConversationEnd);

  const categoryLabel = (() => {
    const cat = conversation.categoria || 'Lección';
    const mapping: Record<string, string> = {
      'Jatetxea': 'Restaurante',
      'Harrera': 'Recepción',
      'Kexak': 'Quejas',
      'Kexak eta erreklamazioak': 'Quejas y Reclamaciones'
    };
    return mapping[cat] || cat;
  })();

  return (
    <div className="flex flex-col min-h-[85vh] animate-fade-in pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => { actions.handleStop(); onBack(); }}
          className="p-3 bg-white/5 border border-white/10 rounded-2xl text-white hover:bg-white/10 transition-all active:scale-90"
          aria-label="Volver al listado de diálogos"
        >
          <ArrowLeftIcon className="w-6 h-6" />
        </button>
        <div className="text-center">
          <h1 className="text-2xl font-black text-white leading-tight">{conversation.title}</h1>
          <p className="text-xs text-accent font-bold uppercase tracking-widest">{categoryLabel}</p>
        </div>
        <button
          onClick={() => actions.setIsFocusMode(!state.isFocusMode)}
          className={`p-3 border rounded-2xl transition-all active:scale-90 flex items-center gap-2 ${state.isFocusMode ? 'bg-accent border-accent text-white shadow-lg' : 'bg-white/5 border-white/10 text-gray-400'}`}
          aria-pressed={state.isFocusMode}
          aria-label={state.isFocusMode ? "Cambiar a vista de lista completa" : "Cambiar a vista de enfoque interactivo"}
        >
          {state.isFocusMode ? <Bars3BottomLeftIcon className="w-5 h-5" /> : <ViewColumnsIcon className="w-5 h-5" />}
          <span className="hidden md:inline text-xs font-black uppercase tracking-widest">{state.isFocusMode ? 'Lista' : 'Enfoque'}</span>
        </button>
      </div>

      <p className="text-gray-400 text-center mb-10 max-w-xl mx-auto italic font-medium">
        "{conversation.description}"
      </p>

      {/* Profile & Controls */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 mb-10 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-accent opacity-5 blur-3xl rounded-full" aria-hidden="true"></div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center relative z-10">
          <div>
            <label className="block text-[10px] uppercase font-black tracking-[0.2em] text-gray-500 mb-4">Elige tu personaje</label>
            <div className="flex flex-wrap gap-3" role="radiogroup" aria-label="Selecciona tu rol en la conversación">
              <button
                onClick={() => { actions.handleStop(); actions.setSelectedRole('Todos'); }}
                className={`px-6 py-3 rounded-2xl font-bold transition-all border ${state.selectedRole === 'Todos' ? 'bg-accent border-accent text-white shadow-lg scale-105' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
                aria-checked={state.selectedRole === 'Todos'}
                role="radio"
              >
                Escuchar ambos
              </button>
              {conversation.participants.map(p => (
                <button
                  key={p}
                  onClick={() => { actions.handleStop(); actions.setSelectedRole(p); }}
                  className={`px-6 py-3 rounded-2xl font-bold transition-all border ${state.selectedRole === p ? 'bg-accent border-accent text-white shadow-lg scale-105' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
                  aria-checked={state.selectedRole === p}
                  role="radio"
                >
                  Ser {p}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-center md:justify-end gap-3">
            {!state.isPlaying ? (
              <button
                onClick={actions.handlePlayAll}
                className="bg-accent hover:brightness-110 text-white font-black py-4 px-10 rounded-2xl shadow-xl transition-all active:scale-95 flex items-center gap-3 group"
                aria-label="Reproducir conversación completa automáticamente"
              >
                <PlayIcon className="w-5 h-5 fill-current group-hover:scale-110 transition-transform" />
                REPRODUCIR TODO
              </button>
            ) : (
              <button
                onClick={actions.handleStop}
                className="bg-red-500 hover:brightness-110 text-white font-black py-4 px-10 rounded-2xl shadow-xl transition-all active:scale-95 flex items-center gap-3"
                aria-label="Detener reproducción"
              >
                <PauseIcon className="w-5 h-5 fill-current animate-pulse" />
                DETENER
              </button>
            )}
          </div>
        </div>

        <div className="mt-8 border-t border-white/5 pt-6">
          <CollapsibleSection title="Ajustes de Voces">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
              {conversation.participants.map(participant => (
                <div key={participant} className="bg-white/10 p-6 rounded-3xl border border-white/10 shadow-inner">
                  <h4 className="flex items-center gap-2 font-black text-white mb-4 uppercase text-xs tracking-widest text-accent">
                    <UserCircleIcon className="w-5 h-5" />
                    {participant}
                  </h4>
                  <VoiceSettings
                    settings={state.conversationSettings[participant] || { voiceURI: '', rate: 1, pitch: 1 }}
                    onSettingChange={(setting, value) => actions.setConversationParticipantSetting(participant, setting, value)}
                    showTitle={false}
                  />
                </div>
              ))}
            </div>
          </CollapsibleSection>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-4xl mx-auto w-full px-4">
        {state.isFocusMode ? (
          <div className="relative min-h-[400px] flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={state.currentTurnIndex}
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -50, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="w-full flex flex-col items-center"
              >
                <ConversationBubble 
                  turn={conversation.dialogue[state.currentTurnIndex]}
                  isMyTurn={conversation.dialogue[state.currentTurnIndex].speaker === state.selectedRole}
                  isParticipant0={conversation.dialogue[state.currentTurnIndex].speaker === conversation.participants[0]}
                  targetLanguage={state.targetLanguage}
                  onPlay={() => actions.handlePlayTurn(conversation.dialogue[state.currentTurnIndex])}
                  index={state.currentTurnIndex}
                  isFocusMode={true}
                />

                <div className="flex items-center gap-8 mt-12 bg-white/5 p-4 rounded-3xl border border-white/5 backdrop-blur-sm shadow-xl">
                  <button
                    disabled={state.currentTurnIndex === 0}
                    onClick={actions.goToPrevTurn}
                    className="p-4 bg-white/5 border border-white/10 rounded-2xl text-white disabled:opacity-10 hover:bg-white/10 transition-all active:scale-90"
                    aria-label="Frase anterior"
                  >
                    <ArrowLeftIcon className="w-6 h-6" />
                  </button>
                  <span className="text-sm font-black text-white px-4 min-w-[100px] text-center" role="status">
                    {state.currentTurnIndex + 1} / {conversation.dialogue.length}
                  </span>
                  <button
                    disabled={state.currentTurnIndex === conversation.dialogue.length - 1}
                    onClick={actions.goToNextTurn}
                    className="p-4 bg-white/5 border border-white/10 rounded-2xl text-white disabled:opacity-10 hover:bg-white/10 transition-all active:scale-90"
                    aria-label="Siguiente frase"
                  >
                    <ArrowLeftIcon className="w-6 h-6 rotate-180" />
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        ) : (
          <div className="space-y-6">
            {conversation.dialogue.map((turn, index) => (
              <ConversationBubble 
                key={index}
                turn={turn}
                isMyTurn={turn.speaker === state.selectedRole}
                isParticipant0={turn.speaker === conversation.participants[0]}
                targetLanguage={state.targetLanguage}
                onPlay={() => actions.handlePlayTurn(turn, index)}
                index={index}
                isFocusMode={false}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
