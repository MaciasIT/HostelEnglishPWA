import React, { useState, useEffect } from 'react';
import { SparklesIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { useAppStore } from '@/store/useAppStore';

interface VoiceSettingsProps {
  settings: {
    voiceURI: string;
    rate: number;
    pitch: number;
  };
  onSettingChange: (setting: 'voiceURI' | 'rate' | 'pitch', value: string | number) => void;
  title?: string;
  showTitle?: boolean;
}

const defaultSettings = { voiceURI: '', rate: 1, pitch: 1 };

const VoiceSettings: React.FC<VoiceSettingsProps> = ({
  settings = defaultSettings,
  onSettingChange,
  title = "Configuración de Voz",
  showTitle = true
}) => {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const targetLanguage = useAppStore(state => state.prefs.targetLanguage);

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      // Filter voices based on the target language code (en or eu)
      const langCode = targetLanguage === 'eu' ? 'eu' : 'en';
      const filteredVoices = availableVoices.filter(voice => voice.lang.startsWith(langCode));
      setVoices(filteredVoices);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [targetLanguage]);

  const handleVoiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedVoiceURI = e.target.value;
    onSettingChange('voiceURI', selectedVoiceURI);
  };

  return (
    <div className="space-y-6">
      {showTitle && (
        <h3 className="text-xl font-black text-primary flex items-center gap-2 mb-6">
          <SparklesIcon className="w-5 h-5 text-accent" />
          {title}
        </h3>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Voice Selector */}
        <div className="space-y-4">
          <label htmlFor="voice-select" className="block text-[10px] uppercase font-black text-tertiary tracking-widest">
            Voz del sistema
          </label>
          <div className="relative group">
            <select
              id="voice-select"
              className="w-full pl-4 pr-10 py-4 bg-surface/5 border border-border/10 rounded-2xl text-primary font-bold appearance-none focus:ring-2 focus:ring-accent outline-none transition-all group-hover:bg-surface/10"
              value={settings.voiceURI}
              onChange={handleVoiceChange}
            >
              <option value="" className="bg-surface">Voz por defecto</option>
              {voices.map(voice => (
                <option key={voice.voiceURI} value={voice.voiceURI} className="bg-surface">
                  {voice.name}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-tertiary pointer-events-none group-hover:text-accent transition-colors" />
          </div>
        </div>

        {/* Rate Slider */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <label htmlFor="rate-slider" className="text-[10px] uppercase font-black text-tertiary tracking-widest">
              Velocidad
            </label>
            <span className="text-accent font-black text-xs bg-accent/10 px-2 py-0.5 rounded-md">{settings.rate}x</span>
          </div>
          <input
            id="rate-slider"
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={settings.rate}
            onChange={(e) => onSettingChange('rate', Number(e.target.value))}
            className="w-full h-2 bg-surface/5 border border-border/10 rounded-lg appearance-none cursor-pointer accent-accent"
          />
          <div className="flex justify-between text-[8px] text-secondary font-black uppercase">
            <span>Lento</span>
            <span>Rápido</span>
          </div>
        </div>

        {/* Pitch Slider */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <label htmlFor="pitch-slider" className="text-[10px] uppercase font-black text-tertiary tracking-widest">
              Tono
            </label>
            <span className="text-accent font-black text-xs bg-accent/10 px-2 py-0.5 rounded-md">{settings.pitch}</span>
          </div>
          <input
            id="pitch-slider"
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={settings.pitch}
            onChange={(e) => onSettingChange('pitch', Number(e.target.value))}
            className="w-full h-2 bg-surface/5 border border-border/10 rounded-lg appearance-none cursor-pointer accent-accent"
          />
          <div className="flex justify-between text-[8px] text-secondary font-black uppercase">
            <span>Grave</span>
            <span>Agudo</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceSettings;
