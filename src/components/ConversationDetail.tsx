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
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

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

  const handlePlayTurn = (turn: ConversationTurn) => {
    isPlayingAllRef.current = false;
    setIsPlaying(false);
    window.speechSynthesis.cancel();

    const textToSpeak = targetLanguage === 'eu' ? turn.eu : turn.en;
    const voiceLang = targetLanguage === 'eu' ? 'eu-ES' : 'en-US';

    if (!textToSpeak?.trim()) return;

    const participantSettings = conversationSettings[turn.speaker] || { voiceURI: '', rate: 1, pitch: 1 };
    const selectedVoice = availableVoices.find(voice => voice.voiceURI === participantSettings.voiceURI);

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = voiceLang;
    utterance.rate = participantSettings.rate;
    utterance.pitch = participantSettings.pitch;

    // Only use the saved voice if it matches the current target language
    if (selectedVoice && selectedVoice.lang.startsWith(targetLanguage === 'eu' ? 'eu' : 'en')) {
      utterance.voice = selectedVoice;
    }

    window.speechSynthesis.speak(utterance);
  };

  const handlePlayAll = useCallback(() => {
    window.speechSynthesis.cancel();
    isPlayingAllRef.current = true;
    setIsPlaying(true);

    let i = 0;
    const playNextTurn = () => {
      if (!isPlayingAllRef.current) return;
      if (i < conversation.dialogue.length) {
        const turn = conversation.dialogue[i];
        const textToSpeak = targetLanguage === 'eu' ? turn.eu : turn.en;
        const voiceLang = targetLanguage === 'eu' ? 'eu-ES' : 'en-US';

        if (!textToSpeak?.trim()) { i++; playNextTurn(); return; }

        const participantSettings = conversationSettings[turn.speaker] || { voiceURI: '', rate: 1, pitch: 1 };
        const selectedVoice = availableVoices.find(voice => voice.voiceURI === participantSettings.voiceURI);

        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.lang = voiceLang;
        utterance.rate = participantSettings.rate;
        utterance.pitch = participantSettings.pitch;

        if (selectedVoice && selectedVoice.lang.startsWith(targetLanguage === 'eu' ? 'eu' : 'en')) {
          utterance.voice = selectedVoice;
        }

        utterance.onend = () => { if (isPlayingAllRef.current) { i++; playNextTurn(); } };
        utterance.onerror = () => { if (isPlayingAllRef.current) { i++; playNextTurn(); } };

        window.speechSynthesis.speak(utterance);
      } else {
        isPlayingAllRef.current = false;
        setIsPlaying(false);
        onConversationEnd();
      }
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
          <p className="text-xs text-accent font-bold uppercase tracking-widest">{conversation.categoria || 'Lección de Hostelería'}</p>
        </div>
        <div className="w-12"></div>
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
      <div className="space-y-6 max-w-4xl mx-auto w-full pb-20">
        {conversation.dialogue.map((turn, index) => {
          const isMyTurn = turn.speaker === selectedRole;
          const isParticipant0 = turn.speaker === conversation.participants[0];

          return (
            <div
              key={index}
              className={`flex flex-col ${isParticipant0 ? 'items-start' : 'items-end'} animate-in slide-in-from-bottom-4 duration-500`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={`max-w-[85%] rounded-[2rem] p-6 shadow-xl relative group ${isMyTurn
                ? 'bg-accent/20 border-2 border-accent/40 rounded-br-none'
                : (isParticipant0 ? 'bg-white/10 rounded-bl-none' : 'bg-primary-light/10 rounded-br-none')
                }`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${isMyTurn ? 'text-accent' : 'text-gray-500'}`}>
                    {turn.speaker} {isMyTurn ? '(TÚ)' : ''}
                  </span>
                  {!isMyTurn && (
                    <button
                      onClick={() => handlePlayTurn(turn)}
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
                    <p className="text-gray-400 text-sm leading-relaxed">{turn.es}</p>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ConversationDetail;
