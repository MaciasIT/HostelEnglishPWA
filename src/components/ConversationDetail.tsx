import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';
import CollapsibleSection from '@/components/CollapsibleSection';

/**
 * Represents a single turn in a conversation, spoken by a specific participant.
 */
type ConversationTurn = {
  speaker: string; // More generic to accept any role
  en: string;
  es: string;
  audio?: string;
};

/**
 * Represents a full conversation with a title, description, dialogue turns, and participants.
 */
type Conversation = {
  id: number;
  title: string;
  description: string;
  dialogue: ConversationTurn[];
  participants: string[]; // Add participants
};

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
  const audioSpeed = useAppStore((state) => state.prefs.audioSpeed);
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

    window.speechSynthesis.cancel(); // Cancel any ongoing speech
    window.speechSynthesis.speak(utterance);
  };

    // Maneja el botón de volver y detiene la reproducción
    const handleBack = () => {
      isPlayingAllRef.current = false;
      window.speechSynthesis.cancel();
      onBack();
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
          playNextTurn; // Skip to next turn if text is empty
          return;
        }

        const participantSettings = conversationSettings[turn.speaker] || { voiceURI: '', rate: 1, pitch: 1 };
        const selectedVoice = availableVoices.find(voice => voice.voiceURI === participantSettings.voiceURI);

        console.log(`Playing all turn ${i} for ${turn.speaker} with rate: ${participantSettings.rate}`);

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
          playNextTurn(); // Continue to next turn even on error
        };

        window.speechSynthesis.speak(utterance);
      } else {
        isPlayingAllRef.current = false;
        // All turns played
        console.log("Conversation playback finished.");
        onConversationEnd(); // Notify parent component that conversation has ended
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

      <div className="mb-6 p-4 bg-primary-dark rounded-md">
        <h2 className="text-xl font-bold mb-4 text-white">Configuración de Voces por Rol</h2>
        <button
          onClick={handlePlayAll}
          className="mb-4 px-4 py-2 bg-accent rounded-md text-white hover:bg-accent-dark focus:outline-none focus:ring-2 focus:ring-accent focus:ring-opacity-50"
        >
          Reproducir Toda la Conversación
        </button>
        {conversation.participants.map(participant => {
          // Corrección: protege el acceso a conversationSettings
          const participantSettings =
            (conversationSettings && conversationSettings[participant]) ||
            { voiceURI: '', rate: 1, pitch: 1 };
          const defaultVoice = availableVoices.find(v => v.voiceURI === participantSettings.voiceURI);

          return (
            <div key={participant} className="mb-4 p-3 border border-primary rounded-md">
              <h3 className="font-semibold mb-2 text-white">{participant}</h3>
              
              {/* Voice Selection */}
              <label htmlFor={`voice-select-${participant}`} className="block mb-1 text-sm font-medium text-gray-300">Voz:</label>
              <select
                id={`voice-select-${participant}`}
                className="w-full p-2 border rounded-md bg-primary-light border-primary-dark text-white mb-2"
                value={participantSettings.voiceURI}
                onChange={(e) => { isPlayingAllRef.current = false; window.speechSynthesis.cancel(); setConversationParticipantSetting(participant, 'voiceURI', e.target.value); }}
              >
                <option value="">Por defecto</option>
                {availableVoices.map(voice => (
                  <option key={voice.voiceURI} value={voice.voiceURI}>
                    {voice.name} ({voice.lang})
                  </option>
                ))}
              </select>

              {/* Rate Control */}
              <label htmlFor={`rate-range-${participant}`} className="block mb-1 text-sm font-medium text-gray-300">Velocidad: {participantSettings.rate.toFixed(1)}</label>
              <input
                type="range"
                id={`rate-range-${participant}`}
                min="0.5" max="2" step="0.1"
                value={participantSettings.rate}
                onChange={(e) => { isPlayingAllRef.current = false; window.speechSynthesis.cancel(); setConversationParticipantSetting(participant, 'rate', parseFloat(e.target.value)); }}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 mb-2"
              />

              {/* Pitch Control */}
              <label htmlFor={`pitch-range-${participant}`} className="block mb-1 text-sm font-medium text-gray-300">Tono: {participantSettings.pitch.toFixed(1)}</label>
              <input
                type="range"
                id={`pitch-range-${participant}`}
                min="0" max="2" step="0.1"
                value={participantSettings.pitch}
                onChange={(e) => { isPlayingAllRef.current = false; window.speechSynthesis.cancel(); setConversationParticipantSetting(participant, 'pitch', parseFloat(e.target.value)); }}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
            </div>
          );
        })}
      </div>

      <div className="space-y-6">
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
