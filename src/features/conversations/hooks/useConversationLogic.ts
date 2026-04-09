import { useState, useEffect, useCallback, useRef } from 'react';
import { useAppStore, Conversation, ConversationTurn } from '@/store/useAppStore';
import { playAudio } from '@/utils/audio';

export function useConversationLogic(conversation: Conversation, onConversationEnd: () => void) {
  const isPlayingAllRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const [selectedRole, setSelectedRole] = useState('Todos');
  const [isFocusMode, setIsFocusMode] = useState(true);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  const { conversationSettings, setConversationParticipantSetting, targetLanguage } = useAppStore((state) => ({
    conversationSettings: state.prefs.conversationSettings,
    setConversationParticipantSetting: state.setConversationParticipantSetting,
    targetLanguage: state.prefs.targetLanguage,
  }));

  const getSortedVoices = useCallback((voices: SpeechSynthesisVoice[]) => {
    const langCode = targetLanguage === 'eu' ? 'eu' : 'en';
    const primaryVoices = voices.filter(voice => voice.lang.startsWith(langCode));
    const otherVoices = voices.filter(voice => !voice.lang.startsWith(langCode));
    return [
      ...primaryVoices.sort((a, b) => a.name.localeCompare(b.name)), 
      ...otherVoices.sort((a, b) => a.name.localeCompare(b.name))
    ];
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
    }
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, [getSortedVoices]);

  useEffect(() => {
    return () => {
      isPlayingAllRef.current = false;
      window.speechSynthesis.cancel();
    };
  }, []);

  const handleStop = useCallback(() => {
    isPlayingAllRef.current = false;
    setIsPlaying(false);
    window.speechSynthesis.cancel();
  }, []);

  const handlePlayTurn = useCallback(async (turn: ConversationTurn, index?: number) => {
    handleStop();
    if (index !== undefined) setCurrentTurnIndex(index);

    const textToSpeak = targetLanguage === 'eu' ? turn.eu : turn.en;
    const langCode = targetLanguage === 'eu' ? 'eu' : 'en';

    if (!textToSpeak?.trim()) return;

    const participantSettings = conversationSettings[turn.speaker] || { voiceURI: '', rate: 1, pitch: 1 };

    await playAudio(textToSpeak, langCode as 'en' | 'eu' | 'es', {
      rate: participantSettings.rate,
      pitch: participantSettings.pitch,
      voiceURI: participantSettings.voiceURI
    });
  }, [targetLanguage, conversationSettings, handleStop]);

  const handlePlayAll = useCallback(() => {
    handleStop();
    isPlayingAllRef.current = true;
    setIsPlaying(true);

    let i = currentTurnIndex;
    if (i >= conversation.dialogue.length) i = 0;

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
          await playAudio(textToSpeak, langCode as 'en' | 'eu' | 'es', {
            rate: participantSettings.rate,
            pitch: participantSettings.pitch,
            voiceURI: participantSettings.voiceURI
          });

          if (isPlayingAllRef.current) {
            i++;
            if (i < conversation.dialogue.length) {
              playNextTurn();
            } else {
              finish();
            }
          }
        } catch (e) {
          console.error("Error playing dialogue turn", e);
          if (isPlayingAllRef.current) {
            i++;
            if (i < conversation.dialogue.length) playNextTurn();
            else finish();
          }
        }
      } else {
        finish();
      }
    };

    const finish = () => {
      isPlayingAllRef.current = false;
      setIsPlaying(false);
      setCurrentTurnIndex(0);
      onConversationEnd();
    };

    playNextTurn();
  }, [conversation, conversationSettings, currentTurnIndex, onConversationEnd, targetLanguage, handleStop]);

  const goToNextTurn = useCallback(() => {
    handleStop();
    if (currentTurnIndex < conversation.dialogue.length - 1) {
      setCurrentTurnIndex(prev => prev + 1);
    }
  }, [currentTurnIndex, conversation.dialogue.length, handleStop]);

  const goToPrevTurn = useCallback(() => {
    handleStop();
    if (currentTurnIndex > 0) {
      setCurrentTurnIndex(prev => prev - 1);
    }
  }, [currentTurnIndex, handleStop]);

  return {
    state: {
      isPlaying,
      currentTurnIndex,
      selectedRole,
      isFocusMode,
      availableVoices,
      conversationSettings,
      targetLanguage
    },
    actions: {
      setIsPlaying,
      setCurrentTurnIndex,
      setSelectedRole,
      setIsFocusMode,
      handlePlayTurn,
      handlePlayAll,
      handleStop,
      setConversationParticipantSetting,
      goToNextTurn,
      goToPrevTurn
    }
  };
}
