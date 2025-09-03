import { useState, useEffect } from 'react';
import useSpeech from './useSpeech'; // Importar useSpeech

interface UseAudioResult {
  playAudio: (url: string, speed?: number, useTTSFallback?: boolean) => void;
  stopAudio: () => void;
  playing: boolean;
}

export function useAudio(): UseAudioResult { // Cambiado a named export
  const [audio] = useState(new Audio());
  const [playing, setPlaying] = useState(false);
  const { speak, cancel: cancelSpeech } = useSpeech(); // Usar useSpeech para TTS

  useEffect(() => {
    const handlePlay = () => setPlaying(true);
    const handlePause = () => setPlaying(false);
    const handleEnded = () => setPlaying(false);

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      cancelSpeech(); // Cancelar cualquier síntesis de voz pendiente al desmontar
    };
  }, [audio, cancelSpeech]);

  const playAudio = (url: string, speed: number = 1, useTTSFallback: boolean = false) => {
    stopAudio(); // Detener cualquier audio o TTS anterior
    cancelSpeech();

    audio.playbackRate = speed;

    if (url && !useTTSFallback) {
      audio.src = url;
      audio.play().catch(e => {
        console.warn("Error playing audio from URL, falling back to TTS:", e);
        if (useTTSFallback) {
          speak(url, 'en-US'); // Si falla el audio, intenta TTS con el texto de la URL
        }
      });
    } else if (useTTSFallback) {
      speak(url, 'en-US'); // Si se fuerza TTS o no hay URL, usa TTS
    }
  };

  const stopAudio = () => {
    audio.pause();
    audio.currentTime = 0;
  };

  return { playAudio, stopAudio, playing };
}
