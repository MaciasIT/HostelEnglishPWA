import { useState, useEffect } from 'react';

interface UseAudioResult {
  playAudio: (url: string) => void;
  stopAudio: () => void;
  playing: boolean;
}

const useAudio = (): UseAudioResult => {
  const [audio] = useState(new Audio());
  const [playing, setPlaying] = useState(false);

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
    };
  }, [audio]);

  const playAudio = (url: string) => {
    if (audio.src !== url) {
      audio.src = url;
    }
    audio.play().catch(e => console.error("Error playing audio:", e));
  };

  const stopAudio = () => {
    audio.pause();
    audio.currentTime = 0;
  };

  return { playAudio, stopAudio, playing };
};

export default useAudio;
