import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAppStore, Conversation, ConversationTurn } from '@/store/useAppStore';
import CollapsibleSection from '@/components/CollapsibleSection';
import VoiceSettings from '@/components/VoiceSettings';
import {
  ArrowLeftIcon,
  PlayIcon,
  PauseIcon,
  SpeakerWaveIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ViewColumnsIcon,
  Bars3BottomLeftIcon
} from '@heroicons/react/24/outline';
import { playAudio } from '@/utils/audio';
import { motion, AnimatePresence } from 'framer-motion';

interface ConversationDetailProps {
  conversation: Conversation;
  onBack: () => void;
  onConversationEnd: () => void;
}

const ConversationDetail: React.FC<ConversationDetailProps> = ({ conversation, onBack, onConversationEnd }) => {
  const isPlayingAllRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const { conversationSettings, setConversationParticipantSetting, targetLanguage } = useAppStore((state) => ({
    conversationSettings: state.prefs.conversationSettings,
    setConversationParticipantSetting: state.setConversationParticipantSetting,
    targetLanguage: state.prefs.targetLanguage,
  }));
  const [selectedRole, setSelectedRole] = useState('Todos');
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isFocusMode, setIsFocusMode] = useState(true);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const getSortedVoices = useCallback((voices: SpeechSynthesisVoice[]) => {
    const langCode = targetLanguage === 'eu' ? 'eu' : 'en';
    const primaryVoices = voices.filter(voice => voice.lang.startsWith(langCode));
    const otherVoices = voices.filter(voice => !voice.lang.startsWith(langCode));
    return [...primaryVoices.sort((a, b) => a.name.localeCompare(b.name)), ...otherVoices.sort((a, b) => a.name.localeCompare(b.name))];
  }, [targetLanguage]);

  useEffect(() => {
    const populateVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(getSortedVoices(voices));
    };

    if (window.speechSynthesis.getVoices().length > 0) {
      populateVoices();
    } else {
      window.speechSynthesis.onvoiceschanged = populateVoices;
      return () => { window.speechSynthesis.onvoiceschanged = null; };
    }
  }, [getSortedVoices]);

  useEffect(() => {
    return () => {
      isPlayingAllRef.current = false;
      window.speechSynthesis.cancel();
    };
  }, []);

  const handlePlayTurn = async (turn: ConversationTurn, index?: number) => {
    isPlayingAllRef.current = false;
    setIsPlaying(false);
    window.speechSynthesis.cancel();

    if (index !== undefined) setCurrentTurnIndex(index);

    const textToSpeak = targetLanguage === 'eu' ? turn.eu : turn.en;
    const langCode = targetLanguage === 'eu' ? 'eu' : 'en';

    if (!textToSpeak?.trim()) return;

    const participantSettings = conversationSettings[turn.speaker] || { voiceURI: '', rate: 1, pitch: 1 };

    await playAudio(textToSpeak, langCode as 'en' | 'eu', {
      rate: participantSettings.rate,
      pitch: participantSettings.pitch,
      voiceURI: participantSettings.voiceURI
    });
  };

  const handlePlayAll = useCallback(() => {
    window.speechSynthesis.cancel();
    isPlayingAllRef.current = true;
    setIsPlaying(true);

    let i = currentTurnIndex;
    if (i >= conversation.dialogue.length) i = 0; // Guard for out of bounds

    const playNextTurn = async () => {
      if (!isPlayingAllRef.current) return;

      if (i < conversation.dialogue.length) {
        const turn = conversation.dialogue[i];
        setCurrentTurnIndex(i);
        const textToSpeak = targetLanguage === 'eu' ? turn.eu : turn.en;
        const langCode = targetLanguage === 'eu' ? 'eu' : 'en';

        if (!textToSpeak?.trim()) {
          i++;
          playNextTurn();
          return;
        }

        const participantSettings = conversationSettings[turn.speaker] || { voiceURI: '', rate: 1, pitch: 1 };

        try {
          // Now playAudio is properly awaited also for native speech
          await playAudio(textToSpeak, langCode as 'en' | 'eu', {
            rate: participantSettings.rate,
            pitch: participantSettings.pitch,
            voiceURI: participantSettings.voiceURI
          });

          if (isPlayingAllRef.current) {
            i++;
            if (i < conversation.dialogue.length) {
              playNextTurn();
            } else {
              finishConversation();
            }
          }
        } catch (e) {
          console.error("Error playing dialogue turn", e);
          if (isPlayingAllRef.current) {
            i++;
            if (i < conversation.dialogue.length) {
              playNextTurn();
            } else {
              finishConversation();
            }
          }
        }
      } else {
        finishConversation();
      }
    };

    const finishConversation = () => {
      isPlayingAllRef.current = false;
      setIsPlaying(false);
      setCurrentTurnIndex(0);
      onConversationEnd();
    };

    playNextTurn();
  }, [conversation, conversationSettings, availableVoices, onConversationEnd, targetLanguage]);

  const handleStop = () => {
    isPlayingAllRef.current = false;
    setIsPlaying(false);
    window.speechSynthesis.cancel();
  };

  return (
    <div className="flex flex-col min-h-[85vh] animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => { handleStop(); onBack(); }}
          className="p-3 bg-white/5 border border-white/10 rounded-2xl text-white hover:bg-white/10 transition-all active:scale-90"
          aria-label="Volver"
        >
          <ArrowLeftIcon className="w-6 h-6" />
        </button>
        <div className="text-center">
          <h1 className="text-2xl font-black text-white leading-tight">{conversation.title}</h1>
          <p className="text-xs text-accent font-bold uppercase tracking-widest">
            {(() => {
              const cat = conversation.categoria || 'Lección de Hostelería';
              if (cat === 'Jatetxea') return 'Restaurante';
              if (cat === 'Harrera') return 'Recepción';
              if (cat === 'Kexak') return 'Quejas';
              if (cat === 'Kexak eta erreklamazioak') return 'Quejas y Reclamaciones';
              return cat;
            })()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFocusMode(!isFocusMode)}
            className={`p-3 border rounded-2xl transition-all active:scale-90 flex items-center gap-2 ${isFocusMode ? 'bg-accent border-accent text-white shadow-lg' : 'bg-white/5 border-white/10 text-gray-400'}`}
            title={isFocusMode ? "Cambiar a vista de lista" : "Cambiar a vista enfocada"}
          >
            {isFocusMode ? <Bars3BottomLeftIcon className="w-5 h-5" /> : <ViewColumnsIcon className="w-5 h-5" />}
            <span className="hidden md:inline text-xs font-black uppercase tracking-widest">{isFocusMode ? 'Lista' : 'Enfoque'}</span>
          </button>
          <div className="w-12 md:hidden"></div>
        </div>
      </div>

      <p className="text-gray-400 text-center mb-10 max-w-xl mx-auto italic">
        "{conversation.description}"
      </p>

      {/* Profile & Controls */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 mb-10 shadow-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <label className="block text-[10px] uppercase font-black tracking-[0.2em] text-gray-500 mb-4">Elige tu personaje</label>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => { handleStop(); setSelectedRole('Todos'); }}
                className={`px-6 py-3 rounded-2xl font-bold transition-all border ${selectedRole === 'Todos' ? 'bg-accent border-accent text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
              >
                Escuchar ambos
              </button>
              {conversation.participants.map(p => (
                <button
                  key={p}
                  onClick={() => { handleStop(); setSelectedRole(p); }}
                  className={`px-6 py-3 rounded-2xl font-bold transition-all border ${selectedRole === p ? 'bg-accent border-accent text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
                >
                  Ser {p}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-center md:justify-end gap-3">
            {!isPlaying ? (
              <button
                onClick={handlePlayAll}
                className="bg-accent hover:brightness-110 text-white font-black py-4 px-8 rounded-2xl shadow-xl transition-all active:scale-95 flex items-center gap-3"
              >
                <PlayIcon className="w-5 h-5 fill-current" />
                REPRODUCIR TODO
              </button>
            ) : (
              <button
                onClick={handleStop}
                className="bg-red-500 hover:brightness-110 text-white font-black py-4 px-8 rounded-2xl shadow-xl transition-all active:scale-95 flex items-center gap-3"
              >
                <PauseIcon className="w-5 h-5 fill-current" />
                DETENER
              </button>
            )}
          </div>
        </div>

        <div className="mt-8 border-t border-white/5 pt-6">
          <CollapsibleSection title="Ajustes de Voces">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
              {conversation.participants.map(participant => (
                <div key={participant} className="bg-white/5 p-6 rounded-3xl border border-white/10">
                  <h4 className="flex items-center gap-2 font-black text-white mb-4">
                    <UserCircleIcon className="w-5 h-5 text-accent" />
                    {participant}
                  </h4>
                  <VoiceSettings
                    settings={conversationSettings[participant] || { voiceURI: '', rate: 1, pitch: 1 }}
                    onSettingChange={(setting, value) => setConversationParticipantSetting(participant, setting, value)}
                    showTitle={false}
                  />
                </div>
              ))}
            </div>
          </CollapsibleSection>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="max-w-4xl mx-auto w-full pb-20 px-4">
        {isFocusMode ? (
          <div className="relative min-h-[300px] flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTurnIndex}
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -50, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="w-full"
              >
                {(() => {
                  const turn = conversation.dialogue[currentTurnIndex];
                  const isMyTurn = turn.speaker === selectedRole;
                  const isParticipant0 = turn.speaker === conversation.participants[0];

                  return (
                    <div className={`flex flex-col items-center w-full`}>
                      <div className={`w-full max-w-2xl rounded-[2.5rem] p-10 shadow-2xl relative border-2 ${isMyTurn
                        ? 'bg-accent/20 border-accent/40 rounded-br-none'
                        : (isParticipant0 ? 'bg-white/10 border-white/10' : 'bg-primary-light/10 border-white/10')
                        }`}>
                        <div className="flex items-center justify-center gap-4 mb-6">
                          <span className={`text-xs font-black uppercase tracking-widest ${isMyTurn ? 'text-accent' : 'text-gray-500'}`}>
                            {turn.speaker} {isMyTurn ? '(TÚ)' : ''}
                          </span>
                          {!isMyTurn && (
                            <button
                              onClick={() => handlePlayTurn(turn)}
                              className="p-2 bg-white/5 rounded-full text-accent hover:bg-accent hover:text-white transition-all"
                            >
                              <SpeakerWaveIcon className="w-5 h-5" />
                            </button>
                          )}
                        </div>

                        {isMyTurn ? (
                          <div className="py-8 px-6 bg-accent border border-accent rounded-3xl text-center shadow-lg animate-pulse">
                            <p className="text-xl text-white font-black">¡ES TU TURNO!</p>
                            <p className="text-white/80 text-sm mt-2">Práctica tu pronunciación ahora</p>
                          </div>
                        ) : (
                          <div className="text-center space-y-6">
                            <h3 className="text-2xl md:text-3xl font-black text-white leading-tight">
                              {targetLanguage === 'eu' ? (turn.eu || '...') : turn.en}
                            </h3>
                            <p className="text-gray-300 text-lg md:text-xl font-medium leading-relaxed border-t border-white/5 pt-6 italic">
                              {turn.es}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Manual Navigation for Focus Mode */}
                      <div className="flex items-center gap-8 mt-12">
                        <button
                          disabled={currentTurnIndex === 0}
                          onClick={() => { handleStop(); setCurrentTurnIndex(prev => prev - 1); }}
                          className="p-4 bg-white/5 border border-white/10 rounded-2xl text-white disabled:opacity-20 hover:bg-white/10 transition-all"
                        >
                          <ArrowLeftIcon className="w-5 h-5 rotate-0" />
                        </button>
                        <span className="text-sm font-black text-gray-500 tracking-tighter uppercase">
                          {currentTurnIndex + 1} / {conversation.dialogue.length}
                        </span>
                        <button
                          disabled={currentTurnIndex === conversation.dialogue.length - 1}
                          onClick={() => { handleStop(); setCurrentTurnIndex(prev => prev + 1); }}
                          className="p-4 bg-white/5 border border-white/10 rounded-2xl text-white disabled:opacity-20 hover:bg-white/10 transition-all"
                        >
                          <ArrowLeftIcon className="w-5 h-5 rotate-180" />
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </motion.div>
            </AnimatePresence>
          </div>
        ) : (
          <div className="space-y-6">
            {conversation.dialogue.map((turn, index) => {
              const isMyTurn = turn.speaker === selectedRole;
              const isParticipant0 = turn.speaker === conversation.participants[0];

              return (
                <div
                  key={index}
                  className={`flex flex-col ${isParticipant0 ? 'items-start' : 'items-end'} animate-in slide-in-from-bottom-4 duration-500`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className={`max-w-[100%] md:max-w-[85%] rounded-[2rem] p-6 shadow-xl relative group ${isMyTurn
                    ? 'bg-accent/20 border-2 border-accent/40 rounded-br-none'
                    : (isParticipant0 ? 'bg-white/10 rounded-bl-none' : 'bg-primary-light/10 rounded-br-none')
                    }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-[10px] font-black uppercase tracking-widest ${isMyTurn ? 'text-accent' : 'text-gray-500'}`}>
                        {turn.speaker} {isMyTurn ? '(TÚ)' : ''}
                      </span>
                      {!isMyTurn && (
                        <button
                          onClick={() => handlePlayTurn(turn, index)}
                          className="p-1 text-gray-400 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                          aria-label="Reproducir frase"
                        >
                          <SpeakerWaveIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {isMyTurn ? (
                      <div className="py-4 px-6 bg-accent border border-accent rounded-2xl text-center">
                        <p className="text-white font-black">¡TU TURNO!</p>
                        <p className="text-white/60 text-xs mt-1">Lee en voz alta para practicar</p>
                      </div>
                    ) : (
                      <>
                        <p className="text-xl font-bold text-white mb-2 leading-tight">
                          {targetLanguage === 'eu' ? (turn.eu || '...') : turn.en}
                        </p>
                        <p className="text-gray-300 text-base font-medium leading-relaxed border-t border-white/5 pt-2 mt-2">{turn.es}</p>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationDetail;
