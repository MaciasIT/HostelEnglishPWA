import { useState, useEffect } from 'react';

interface UseSpeechResult {
  speak: (text: string, lang?: string) => void;
  cancel: () => void;
  speaking: boolean;
  supported: boolean;
}

const useSpeech = (): UseSpeechResult => {
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    if ('speechSynthesis' in window) {
      setSupported(true);
    }
  }, []);

  const speak = (text: string, lang: string = 'en-US') => {
    if (!supported) {
      console.warn("Speech synthesis not supported in this browser.");
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = (event) => {
      console.error("Speech synthesis error:", event);
      setSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const cancel = () => {
    if (supported && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    }
  };

  return { speak, cancel, speaking, supported };
};

export default useSpeech;
