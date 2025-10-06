import { useState, useEffect, useRef } from 'react';

interface SpeechRecognitionHook {
  isListening: boolean;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
  browserSupportsSpeechRecognition: boolean;
  error: string | null;
  requestingPermission: boolean;
}

// Extend Window interface to include webkitSpeechRecognition
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

const useSpeechRecognition = (): SpeechRecognitionHook => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [requestingPermission, setRequestingPermission] = useState(false);
  const recognitionRef = useRef<any | null>(null);

  const browserSupportsSpeechRecognition =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  useEffect(() => {
    if (!browserSupportsSpeechRecognition) {
      setError('Tu navegador no soporta la API de reconocimiento de voz.');
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false; // Stop after first result
    recognitionRef.current.interimResults = true; // Get interim results
    recognitionRef.current.lang = 'en-US'; // English language

    recognitionRef.current.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptPart = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcriptPart + ' ';
        } else {
          interimTranscript += transcriptPart;
        }
      }
      setTranscript(finalTranscript.trim());
    };

    recognitionRef.current.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current.onerror = (event: any) => {
      if (event.error === 'not-allowed') {
        setError('Permiso denegado: Por favor, habilita el acceso al micrófono en tu navegador.');
      } else {
        setError(`Error de reconocimiento de voz: ${event.error}`);
      }
      setIsListening(false);
    };

    // Automatically request microphone permissions
    if (browserSupportsSpeechRecognition && recognitionRef.current) {
      try {
        setRequestingPermission(true);
        recognitionRef.current.start();
        recognitionRef.current.stop();
        setRequestingPermission(false);
      } catch (e) {
        console.warn('No se pudo solicitar permisos automáticamente:', e);
        setRequestingPermission(false);
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [browserSupportsSpeechRecognition]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setTranscript(''); // Clear previous transcript
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    browserSupportsSpeechRecognition,
    error,
    requestingPermission,
  };
};

export default useSpeechRecognition;
