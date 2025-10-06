import React, { useState, useEffect } from 'react';

interface VoiceSettingsProps {
  settings: {
    voiceURI: string;
    rate: number;
    pitch: number;
  };
  onSettingChange: (setting: 'voiceURI' | 'rate' | 'pitch', value: string | number) => void;
}

const VoiceSettings: React.FC<VoiceSettingsProps> = ({ settings, onSettingChange }) => {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      const filteredVoices = availableVoices.filter(voice => voice.lang.startsWith('en'));
      setVoices(filteredVoices);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const handleVoiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedVoiceURI = e.target.value;
    onSettingChange('voiceURI', selectedVoiceURI);
  };

  return (
    <div className="bg-primary-dark p-4 rounded-lg mb-4">
      <h3 className="text-lg font-bold text-white mb-2">Configuración de Voz</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="voice-select" className="block mb-2 text-sm font-medium text-white">Voz</label>
          <select
            id="voice-select"
            className="w-full p-2 border rounded-md bg-primary border-primary-dark text-white"
            value={settings.voiceURI}
            onChange={handleVoiceChange}
          >
            <option value="">Voz por defecto</option>
            {voices.map(voice => (
              <option key={voice.voiceURI} value={voice.voiceURI}>
                {voice.name} ({voice.lang})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="rate-slider" className="block mb-2 text-sm font-medium text-white">Velocidad: {settings.rate}</label>
          <input
            id="rate-slider"
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={settings.rate}
            onChange={(e) => onSettingChange('rate', Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
          />
        </div>
        <div>
          <label htmlFor="pitch-slider" className="block mb-2 text-sm font-medium text-white">Tono: {settings.pitch}</label>
          <input
            id="pitch-slider"
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={settings.pitch}
            onChange={(e) => onSettingChange('pitch', Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
          />
        </div>
      </div>
    </div>
  );
};

export default VoiceSettings;
