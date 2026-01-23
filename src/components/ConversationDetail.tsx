import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAppStore, Conversation, ConversationTurn } from '@/store/useAppStore';
import CollapsibleSection from '@/components/CollapsibleSection';
import VoiceSettings from '@/components/VoiceSettings';

interface ConversationDetailProps {
  conversation: Conversation;
  onBack: () => void;
  /**
   * Callback function invoked when the full conversation playback finishes.
   * This allows the parent component to handle post-conversation navigation or options.
   */
  onConversationEnd: () => void;
}

const ConversationDetail: React.FC<ConversationDetailProps> = ({ conversation, onBack, onConversationEnd }) => {
  const isPlayingAllRef = useRef(false);
  const { conversationSettings, setConversationParticipantSetting } = useAppStore((state) => ({
    conversationSettings: state.prefs.conversationSettings,
    setConversationParticipantSetting: state.setConversationParticipantSetting,
  }));
  const [selectedRole, setSelectedRole] = useState('Todos');
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  /**
   * Filters and sorts available speech synthesis voices. English voices are prioritized and listed first.
   * This helps in presenting relevant voice options to the user.
   * @param voices An array of SpeechSynthesisVoice objects.
   * @returns An array containing sorted SpeechSynthesisVoice objects.
   */
  const getSortedVoices = useCallback((voices: SpeechSynthesisVoice[]) => {
    const englishVoices = voices.filter(voice => voice.lang.startsWith('en'));
    const otherVoices = voices.filter(voice => !voice.lang.startsWith('en'));
    // Sort English voices alphabetically by name, then other voices alphabetically by name
    return [...englishVoices.sort((a, b) => a.name.localeCompare(b.name)), ...otherVoices.sort((a, b) => a.name.localeCompare(b.name))];
  }, []);

  useEffect(() => {
    const populateVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(getSortedVoices(voices));
    };

    // Populate voices immediately if they are already loaded
    if (window.speechSynthesis.getVoices().length > 0) {
      populateVoices();
    } else {
      // Otherwise, wait for the voiceschanged event
      window.speechSynthesis.addEventListener('voiceschanged', populateVoices);
      return () => {
        window.speechSynthesis.removeEventListener('voiceschanged', populateVoices);
      };
    }
  }, [getSortedVoices]);

  useEffect(() => {
    // Cleanup function to stop speech synthesis when the component unmounts
    return () => {
      isPlayingAllRef.current = false;
      window.speechSynthesis.cancel();
    };
  }, []);

  /**
   * Plays a single turn of the conversation using the configured voice settings for the speaker.
   * Ensures any previous speech is stopped before starting a new turn.
   * @param turn The ConversationTurn object to play.
   */
  const handlePlayTurn = (turn: ConversationTurn) => {
    isPlayingAllRef.current = false;
    window.speechSynthesis.cancel();
    const textToSpeak = turn.en || '';
    const speechLang = 'en-US';

    if (!textToSpeak.trim()) {
      console.warn("Attempted to speak empty text.");
      return;
    }

    const participantSettings = conversationSettings[turn.speaker] || { voiceURI: '', rate: 1, pitch: 1 };
    const selectedVoice = availableVoices.find(voice => voice.voiceURI === participantSettings.voiceURI);

    console.log(`Playing turn for ${turn.speaker} with rate: ${participantSettings.rate}`);

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = speechLang;
    utterance.rate = participantSettings.rate;
    utterance.pitch = participantSettings.pitch;
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    // window.speechSynthesis.cancel() already called at the start
    window.speechSynthesis.speak(utterance);
  };

  /**
   * Plays all turns of the conversation sequentially, using the configured voice settings for each participant.
   * This provides a continuous listening experience for the entire dialogue.
   */
  const handlePlayAll = useCallback(() => {
    window.speechSynthesis.cancel(); // Stop any ongoing speech
    isPlayingAllRef.current = true;

    let i = 0;
    const playNextTurn = () => {
      if (!isPlayingAllRef.current) return;
      if (i < conversation.dialogue.length) {
        const turn = conversation.dialogue[i];
        const textToSpeak = turn.en || '';
        const speechLang = 'en-US';

        if (!textToSpeak.trim()) {
          console.warn("Attempted to speak empty text for turn", i);
          i++;
          playNextTurn();
          return;
        }

        const participantSettings = conversationSettings[turn.speaker] || { voiceURI: '', rate: 1, pitch: 1 };
        const selectedVoice = availableVoices.find(voice => voice.voiceURI === participantSettings.voiceURI);

        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.lang = speechLang;
        utterance.rate = participantSettings.rate;
        utterance.pitch = participantSettings.pitch;
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }

        utterance.onend = () => {
          if (!isPlayingAllRef.current) return;
          i++;
          playNextTurn();
        };
        utterance.onerror = (event) => {
          if (!isPlayingAllRef.current) return;
          console.error("Speech synthesis error during play all:", event);
          i++;
          playNextTurn();
        };

        window.speechSynthesis.speak(utterance);
      } else {
        isPlayingAllRef.current = false;
        console.log("Conversation playback finished.");
        onConversationEnd();
      }
    };

    playNextTurn();
  }, [conversation, conversationSettings, availableVoices, onConversationEnd]);

  return (
    <div className="p-4 pb-20 bg-primary text-white min-h-screen">
      <button
        onClick={() => { isPlayingAllRef.current = false; window.speechSynthesis.cancel(); onBack(); }}
        className="mb-4 px-4 py-2 bg-primary-dark rounded-md text-white hover:bg-primary"
      >
        ← Volver a la lista
      </button>
      <h1 className="text-2xl font-bold mb-4 text-white">{conversation.title}</h1>
      <p className="text-gray-300 mb-6">{conversation.description}</p>

      <div className="mb-6">
        <label htmlFor="role-select" className="block mb-2 text-sm font-medium text-white">Tu Rol:</label>
        <select
          id="role-select"
          className="w-full p-2 border rounded-md bg-primary-dark border-primary-dark text-white"
          value={selectedRole}
          onChange={(e) => { isPlayingAllRef.current = false; window.speechSynthesis.cancel(); setSelectedRole(e.target.value); }}
        >
          <option value="Todos">Todos</option>
          {conversation.participants.map(participant => (
            <option key={participant} value={participant}>{participant}</option>
          ))}
        </select>
      </div>

      <CollapsibleSection title="Voces por Rol">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-gray-400 mb-2">Configura una voz diferente para cada participante de la conversación.</p>
          <button
            onClick={handlePlayAll}
            className="mb-4 px-4 py-2 bg-accent rounded-md text-white hover:bg-accent-dark focus:outline-none focus:ring-2 focus:ring-accent focus:ring-opacity-50 font-bold"
          >
            Reproducir Toda la Conversación
          </button>
          {conversation.participants.map(participant => (
            <div key={participant} className="border-t border-white/10 pt-4">
              <VoiceSettings
                title={participant}
                settings={conversationSettings[participant] || { voiceURI: '', rate: 1, pitch: 1 }}
                onSettingChange={(setting, value) => {
                  isPlayingAllRef.current = false;
                  window.speechSynthesis.cancel();
                  setConversationParticipantSetting(participant, setting, value);
                }}
              />
            </div>
          ))}
        </div>
      </CollapsibleSection>

      <div className="space-y-6 mt-8">
        {conversation.dialogue.map((turn, index) => {
          const isMyTurn = turn.speaker === selectedRole;
          return (
            <div
              key={index}
              className={`p-4 rounded-lg shadow-md ${isMyTurn ? "bg-accent" : (turn.speaker === conversation.participants[0] ? "bg-primary/10" : "bg-white/10")}`}
            >
              <p className="font-semibold mb-1 text-white">{turn.speaker}:</p>
              {isMyTurn ? (
                <p className="text-lg italic text-gray-300">Tu turno...</p>
              ) : (
                <>
                  <p className="text-lg mb-2 text-white whitespace-normal break-words">{turn.en}</p>
                  <p className="text-gray-300 text-sm italic whitespace-normal break-words">{turn.es}</p>
                  <button
                    onClick={() => handlePlayTurn(turn)}
                    className="mt-3 px-3 py-1 bg-primary text-white rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50"
                  >
                    Reproducir
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ConversationDetail;
