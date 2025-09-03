import { useState, useEffect, useRef } from 'react';

interface UseSpeechResult {
  speak: (text: string, lang?: string, rate?: number, pitch?: number) => void;
  cancel: () => void;
  speaking: boolean;
  supported: boolean;
}

export default function useSpeech(): UseSpeechResult { // Cambiado a named export
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if ('speechSynthesis' in window) {
      setSupported(true);
    }
  }, []);

  const speak = (text: string, lang: string = 'en-US', rate: number = 1, pitch: number = 1) => {
    if (!supported) {
      console.warn("Speech synthesis not supported in this browser.");
      return;
    }

    // Cancel any ongoing speech before starting a new one
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = rate;
    utterance.pitch = pitch;

    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = (event) => {
      console.error("Speech synthesis error:", event);
      setSpeaking(false);
    };

    utteranceRef.current = utterance; // Store reference to the current utterance
    window.speechSynthesis.speak(utterance);
  };

  const cancel = () => {
    if (supported && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    }
  };

  return { speak, cancel, speaking, supported };
}
