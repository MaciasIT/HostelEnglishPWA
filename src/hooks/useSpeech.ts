import { useState, useCallback } from 'react';
import { playAudio } from '@/utils/audio';

interface UseSpeechResult {
  speak: (text: string, lang?: 'en' | 'eu' | 'es', rate?: number, pitch?: number) => Promise<void>;
  cancel: () => void;
  speaking: boolean;
  supported: boolean;
}

export default function useSpeech(): UseSpeechResult {
  const [speaking, setSpeaking] = useState(false);
  const [supported] = useState('speechSynthesis' in window);

  const speak = useCallback(async (text: string, lang: 'en' | 'eu' | 'es' = 'en', rate: number = 1, pitch: number = 1) => {
    setSpeaking(true);
    try {
      await playAudio(text, lang, { rate, pitch });
    } finally {
      setSpeaking(false);
    }
  }, []);

  const cancel = useCallback(() => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  return { speak, cancel, speaking, supported };
}
