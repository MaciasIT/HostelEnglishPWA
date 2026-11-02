import React, { useState, useEffect, useMemo, useRef, useId } from 'react';
import { createPortal } from 'react-dom';
import { Cog6ToothIcon, XMarkIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
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

const ACCENTS = [
  { code: 'GB', flag: '🇬🇧', label: 'Británico (UK)' },
  { code: 'US', flag: '🇺🇸', label: 'Americano (US)' },
  { code: 'AU', flag: '🇦🇺', label: 'Australiano (AU)' },
] as const;

const RATE_PRESETS = [
  { value: 0.8, label: '0.8x', hint: 'Lento' },
  { value: 1, label: '1.0x', hint: 'Normal' },
  { value: 1.2, label: '1.2x', hint: 'Fluido' },
] as const;

const FRIENDLY_NAMES = ['Natural', 'Clara', 'Suave', 'Firme', 'Cálida', 'Nítida'];
const PREVIEW_TEXT = 'Welcome to our hotel, how may I help you?';

/** Extrae el código de región (GB/US/AU...) de un tag de idioma, tolerando "en_GB" (Android). */
export const accentOf = (lang: string): string => {
  const parts = lang.replace('_', '-').split('-');
  return (parts[1] || '').toUpperCase();
};

/** Voces neuronales/naturales primero (heurística por nombre). */
const naturalScore = (v: SpeechSynthesisVoice) =>
  /natural|neural|online|enhanced|premium|google/i.test(v.name) ? 0 : 1;

const chipBase =
  'min-h-11 px-4 rounded-xl text-sm font-bold border transition-colors inline-flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';
const chipOn = 'bg-accent text-on-accent border-accent';
const chipOff = 'bg-surface/5 text-secondary border-border/10 hover:bg-surface/10';

const VoiceSettings: React.FC<VoiceSettingsProps> = ({
  settings = defaultSettings,
  onSettingChange,
  title = 'Ajustes de Voz',
  showTitle = true,
}) => {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [open, setOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const targetLanguage = useAppStore(state => state.prefs.targetLanguage);
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const isEnglish = targetLanguage !== 'eu';

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const loadVoices = () => {
      const langCode = targetLanguage === 'eu' ? 'eu' : 'en';
      setVoices(window.speechSynthesis.getVoices().filter(v => v.lang.toLowerCase().startsWith(langCode)));
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [targetLanguage]);

  const byAccent = useMemo(() => {
    const map: Record<string, SpeechSynthesisVoice[]> = {};
    voices.forEach(v => {
      const a = accentOf(v.lang);
      (map[a] ||= []).push(v);
    });
    Object.values(map).forEach(list => list.sort((a, b) => naturalScore(a) - naturalScore(b)));
    return map;
  }, [voices]);

  const availableAccents = ACCENTS.filter(a => byAccent[a.code]?.length);
  const selectedVoice = voices.find(v => v.voiceURI === settings.voiceURI);
  const selectedAccent = selectedVoice ? accentOf(selectedVoice.lang) : '';
  const accentVoices = byAccent[selectedAccent] ?? [];
  const selectedAccentInfo = ACCENTS.find(a => a.code === selectedAccent);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const trigger = triggerRef.current;
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      trigger?.focus();
    };
  }, [open]);

  const preview = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(
      isEnglish ? PREVIEW_TEXT : 'Ongi etorri gure hotelera, nola lagun zaitzaket?'
    );
    u.lang = isEnglish ? selectedVoice?.lang || 'en-US' : 'eu-ES';
    if (selectedVoice) u.voice = selectedVoice;
    u.rate = settings.rate;
    u.pitch = settings.pitch;
    window.speechSynthesis.speak(u);
  };

  const summary = [selectedAccentInfo ? `${selectedAccentInfo.flag} ${selectedAccentInfo.code}` : 'Auto', `${settings.rate}x`].join(' · ');

  const sheet = open
    ? createPortal(
        <div
          className="safe-area-modal-backdrop fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
          onMouseDown={e => e.target === e.currentTarget && setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative w-full sm:max-w-md max-h-[85vh] overflow-y-auto bg-background border border-border/10 rounded-t-[2rem] sm:rounded-[2rem] p-5 pb-8 shadow-2xl animate-fade-in space-y-6"
          >
            <div className="flex items-center justify-between">
              <h2 id={titleId} className="text-lg font-black text-primary flex items-center gap-2">
                <Cog6ToothIcon className="w-5 h-5 text-accent-text" aria-hidden="true" />
                {title}
              </h2>
              <button
                ref={closeRef}
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar ajustes de voz"
                className="min-w-11 min-h-11 rounded-xl text-tertiary hover:text-primary hover:bg-surface/5 inline-flex items-center justify-center"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <section className="space-y-3">
              <h3 className="text-[10px] uppercase font-black text-tertiary tracking-widest">Acento</h3>
              {isEnglish ? (
                availableAccents.length > 0 ? (
                  <div role="group" aria-label="Acento" className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      aria-pressed={!selectedVoice}
                      onClick={() => onSettingChange('voiceURI', '')}
                      className={`${chipBase} ${!selectedVoice ? chipOn : chipOff}`}
                    >
                      Automática
                    </button>
                    {availableAccents.map(a => {
                      const active = selectedAccent === a.code;
                      return (
                        <button
                          key={a.code}
                          type="button"
                          aria-pressed={active}
                          onClick={() => !active && onSettingChange('voiceURI', byAccent[a.code][0].voiceURI)}
                          className={`${chipBase} ${active ? chipOn : chipOff}`}
                        >
                          <span aria-hidden="true">{a.flag}</span> {a.label}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-secondary">Tu dispositivo usará su voz inglesa por defecto.</p>
                )
              ) : (
                <p className="text-[11px] text-accent-text font-medium leading-relaxed">
                  ✨ Síntesis neuronal de alta fidelidad activa (con adaptación fonética automática si estás sin conexión).
                </p>
              )}

              {isEnglish && accentVoices.length > 1 && (
                <div role="group" aria-label="Voz" className="flex flex-wrap gap-2 pt-1">
                  {accentVoices.map((v, i) => {
                    const active = v.voiceURI === settings.voiceURI;
                    return (
                      <button
                        key={v.voiceURI}
                        type="button"
                        aria-pressed={active}
                        onClick={() => onSettingChange('voiceURI', v.voiceURI)}
                        className={`${chipBase} ${active ? chipOn : chipOff}`}
                      >
                        Voz {i + 1} ({FRIENDLY_NAMES[i % FRIENDLY_NAMES.length]})
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="space-y-3">
              <h3 className="text-[10px] uppercase font-black text-tertiary tracking-widest">Velocidad</h3>
              <div role="group" aria-label="Velocidad" className="grid grid-cols-3 gap-2">
                {RATE_PRESETS.map(p => {
                  const active = Math.abs(settings.rate - p.value) < 0.01;
                  return (
                    <button
                      key={p.value}
                      type="button"
                      aria-pressed={active}
                      onClick={() => onSettingChange('rate', p.value)}
                      className={`${chipBase} flex-col !gap-0 py-2 ${active ? chipOn : chipOff}`}
                    >
                      <span>{p.label}</span>
                      <span className="text-[11px] font-semibold opacity-80">{p.hint}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            <button
              type="button"
              onClick={preview}
              className="w-full min-h-12 rounded-2xl bg-accent/15 text-accent-text font-black border border-accent/30 hover:bg-accent/25 transition-colors inline-flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              🔊 Probar voz
            </button>

            <section>
              <button
                type="button"
                aria-expanded={advancedOpen}
                aria-controls={`${titleId}-adv`}
                onClick={() => setAdvancedOpen(o => !o)}
                className="w-full min-h-11 flex items-center justify-between text-xs font-black uppercase tracking-widest text-tertiary"
              >
                Avanzado
                <ChevronDownIcon className={`w-4 h-4 transition-transform ${advancedOpen ? 'rotate-180' : ''}`} />
              </button>
              {advancedOpen && (
                <div id={`${titleId}-adv`} className="pt-2 space-y-2">
                  <div className="flex justify-between items-center">
                    <label htmlFor={`${titleId}-pitch`} className="text-[10px] uppercase font-black text-tertiary tracking-widest">
                      Tono
                    </label>
                    <span className="text-accent-text font-black text-xs bg-accent/10 px-2 py-0.5 rounded-md">{settings.pitch}</span>
                  </div>
                  <input
                    id={`${titleId}-pitch`}
                    type="range"
                    min="0.5"
                    max="1.5"
                    step="0.1"
                    value={settings.pitch}
                    onChange={e => onSettingChange('pitch', Number(e.target.value))}
                    className="w-full h-8 cursor-pointer accent-accent"
                  />
                  <div className="flex justify-between items-center text-[10px] text-secondary font-black uppercase">
                    <span>Grave</span>
                    <button type="button" onClick={() => onSettingChange('pitch', 1)} className="min-h-11 px-2 text-accent-text">
                      Restablecer
                    </button>
                    <span>Agudo</span>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <div>
      {showTitle && <span className="sr-only">{title}</span>}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="min-h-11 px-4 rounded-xl bg-surface/5 border border-border/10 text-primary text-sm font-bold inline-flex items-center gap-2 hover:bg-surface/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <Cog6ToothIcon className="w-5 h-5 text-accent-text" aria-hidden="true" />
        Ajustes de Voz
        <span className="text-[11px] text-accent-text bg-accent/10 px-2 py-0.5 rounded-md">{summary}</span>
      </button>
      {sheet}
    </div>
  );
};

export default VoiceSettings;
