import { useCallback } from 'react';

const useAudioControl = () => {
  const cancelSpeech = useCallback(() => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
  }, []);

  return { cancelSpeech };
};

export default useAudioControl;
