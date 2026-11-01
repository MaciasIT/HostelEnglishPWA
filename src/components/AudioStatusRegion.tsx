import React from 'react';

export type AudioStatus = 'idle' | 'playing' | 'recording' | 'result';

/** Texto que se anuncia para cada estado de audio. Vacío = no anunciar. */
export function getAudioStatusMessage(status: AudioStatus, isCorrect?: boolean): string {
  switch (status) {
    case 'playing':
      return 'Reproduciendo audio';
    case 'recording':
      return 'Grabando, habla ahora';
    case 'result':
      if (isCorrect === undefined) return '';
      return isCorrect ? 'Resultado: correcto' : 'Resultado: incorrecto';
    default:
      return '';
  }
}

interface AudioStatusRegionProps {
  status: AudioStatus;
  isCorrect?: boolean;
}

/**
 * Región `aria-live="polite"` oculta visualmente que comunica cambios de
 * estado de audio (reproduciendo, grabando, resultado) a lectores de pantalla.
 */
const AudioStatusRegion: React.FC<AudioStatusRegionProps> = ({ status, isCorrect }) => (
  <div role="status" aria-live="polite" aria-atomic="true" className="sr-only" data-testid="audio-status">
    {getAudioStatusMessage(status, isCorrect)}
  </div>
);

export default AudioStatusRegion;
