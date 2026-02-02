import React, { useState, useEffect, useCallback } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { useAppStore } from '@/store/useAppStore';
import {
    Cog6ToothIcon,
    SpeakerWaveIcon,
    BeakerIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    CommandLineIcon
} from '@heroicons/react/24/outline';

const Settings: React.FC = () => {
    const { targetLanguage } = useAppStore(state => ({
        targetLanguage: state.prefs.targetLanguage
    }));

    const [allVoices, setAllVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [testText, setTestText] = useState('Kaixo, hau euskera ahotsaren testa da. Ondo entzuten al da?');
    const [selectedVoiceURI, setSelectedVoiceURI] = useState('');
    const [isTesting, setIsTesting] = useState(false);

    useEffect(() => {
        const loadVoices = () => {
            const voices = window.speechSynthesis.getVoices();
            setAllVoices(voices);
        };
        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;
        return () => { window.speechSynthesis.onvoiceschanged = null; };
    }, []);

    const handleTestVoice = (voiceURI: string) => {
        window.speechSynthesis.cancel();
        const voice = allVoices.find(v => v.voiceURI === voiceURI);
        if (!voice) return;

        const utterance = new SpeechSynthesisUtterance(testText);
        utterance.voice = voice;
        utterance.lang = voice.lang;

        utterance.onstart = () => setIsTesting(true);
        utterance.onend = () => setIsTesting(false);
        utterance.onerror = () => setIsTesting(false);

        window.speechSynthesis.speak(utterance);
    };

    const basqueVoices = allVoices.filter(v => v.lang.startsWith('eu'));
    const recommendedVoices = allVoices.filter(v =>
        v.lang.startsWith('eu') ||
        v.name.toLowerCase().includes('basque') ||
        v.name.toLowerCase().includes('euskara')
    );

    return (
        <PageContainer title="Configuración y Diagnóstico">
            <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">

                {/* TTS Diagnostic Section */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute -right-20 -top-20 w-64 h-64 bg-accent opacity-5 blur-3xl rounded-full"></div>

                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-accent/20 rounded-2xl text-accent">
                            <BeakerIcon className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white">Laboratorio de Voces</h2>
                            <p className="text-gray-500 text-xs uppercase tracking-widest font-bold">Diagnóstico de Text-to-Speech (TTS)</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-1 space-y-6">
                            <div className="bg-black/20 rounded-3xl p-6 border border-white/5">
                                <h3 className="text-sm font-black text-white mb-4 uppercase tracking-tighter flex items-center gap-2">
                                    <CommandLineIcon className="w-4 h-4 text-accent" />
                                    Estado del Sistema
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl">
                                        <span className="text-xs text-gray-400">Voces Totales</span>
                                        <span className="text-sm font-black text-white">{allVoices.length}</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl">
                                        <span className="text-xs text-gray-400">Voces de Euskera</span>
                                        <span className={`text-sm font-black ${basqueVoices.length > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            {basqueVoices.length}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl">
                                        <span className="text-xs text-gray-400">Idioma Actual</span>
                                        <span className="text-sm font-black text-accent uppercase">{targetLanguage}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest ml-2">Frase de Prueba</label>
                                <textarea
                                    className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-sm text-white focus:ring-2 focus:ring-accent outline-none min-h-[100px] transition-all"
                                    value={testText}
                                    onChange={(e) => setTestText(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="lg:col-span-2 space-y-6">
                            <h3 className="text-sm font-black text-white uppercase tracking-widest ml-2">Voces Disponibles en tu Navegador</h3>

                            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {recommendedVoices.length > 0 && (
                                    <div className="mb-4">
                                        <p className="text-[10px] text-accent font-black mb-2 uppercase tracking-widest">Recomendadas (Euskera)</p>
                                        <div className="space-y-2">
                                            {recommendedVoices.map(voice => (
                                                <VoiceCard
                                                    key={voice.voiceURI}
                                                    voice={voice}
                                                    onTest={handleTestVoice}
                                                    isTesting={isTesting}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <p className="text-[10px] text-gray-500 font-black mb-2 uppercase tracking-widest">Resto de Voces del Sistema</p>
                                    <div className="space-y-2">
                                        {allVoices
                                            .filter(v => !recommendedVoices.includes(v))
                                            .map(voice => (
                                                <VoiceCard
                                                    key={voice.voiceURI}
                                                    voice={voice}
                                                    onTest={handleTestVoice}
                                                    isTesting={isTesting}
                                                />
                                            ))
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Info Card */}
                <div className="bg-accent/10 border border-accent/20 rounded-[2rem] p-8 flex items-start gap-6">
                    <div className="p-3 bg-accent rounded-2xl">
                        <ExclamationTriangleIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h4 className="text-xl font-black text-white mb-2">¿No escuchas nada?</h4>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            El Euskera no suele venir instalado por defecto en muchos navegadores.
                            En **Linux**, asegúrate de tener instalados los paquetes `speech-dispatcher` y voces de `espeak-ng` o similares.
                            En **Android/Chrome**, comprueba que los datos de voz de Google estén descargados.
                        </p>
                    </div>
                </div>

            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
            `}} />
        </PageContainer>
    );
};

const VoiceCard = ({ voice, onTest, isTesting }: { voice: SpeechSynthesisVoice, onTest: (uri: string) => void, isTesting: boolean }) => (
    <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all group">
        <div className="flex flex-col">
            <span className="text-sm font-bold text-white group-hover:text-accent transition-colors">{voice.name}</span>
            <span className="text-[10px] text-gray-500 font-mono">{voice.lang} {voice.localService ? '(Local)' : '(Network)'}</span>
        </div>
        <button
            onClick={() => onTest(voice.voiceURI)}
            disabled={isTesting}
            className="p-3 bg-white/5 rounded-xl text-white hover:bg-accent hover:scale-110 active:scale-95 transition-all disabled:opacity-30"
        >
            <SpeakerWaveIcon className="w-5 h-5" />
        </button>
    </div>
);

export default Settings;
