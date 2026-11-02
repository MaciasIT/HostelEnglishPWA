import { useState, useEffect } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { useAppStore } from '@/store/useAppStore';
import RoleSelectionModal from '@/components/RoleSelectionModal';
import { ROLE_LABELS } from '@/utils/roleFilter';
import UpgradeProButton from '@/components/UpgradeProButton';
import {
    SpeakerWaveIcon,
    BeakerIcon,
    ExclamationTriangleIcon,
    CommandLineIcon
} from '@heroicons/react/24/outline';
import { playAudio } from '@/utils/audio';
import DeviceTransferModal, { type TransferMode } from '@/components/sync/DeviceTransferModal';

const Settings = () => {
    const { prefs, isPremium, licenseInfo } = useAppStore();
    const targetLanguage = prefs.targetLanguage;
    const selectedRole = prefs.selectedRole;
    const [roleModalOpen, setRoleModalOpen] = useState(false);
    const [transferMode, setTransferMode] = useState<TransferMode | null>(null);

    const [allVoices, setAllVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [testText, setTestText] = useState(
        targetLanguage === 'eu'
            ? 'Kaixo, hau euskera ahotsaren testa da. Ondo entzuten al da?'
            : 'Good evening! Welcome to our hotel. How can I help you today?'
    );
    const [isTesting, setIsTesting] = useState(false);

    useEffect(() => {
        setTestText(
            targetLanguage === 'eu'
                ? 'Kaixo, hau euskera ahotsaren testa da. Ondo entzuten al da?'
                : 'Good evening! Welcome to our hotel. How can I help you today?'
        );
    }, [targetLanguage]);

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

    const englishVoices = allVoices.filter(v => v.lang.startsWith('en'));
    const basqueVoices = allVoices.filter(v => v.lang.startsWith('eu'));
    const recommendedVoices = allVoices.filter(v =>
        targetLanguage === 'eu'
            ? (v.lang.startsWith('eu') ||
               v.name.toLowerCase().includes('basque') ||
               v.name.toLowerCase().includes('euskara'))
            : v.lang.startsWith('en')
    );

    return (
        <PageContainer title="Configuración y Diagnóstico">
            <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">

                {/* Rol laboral */}
                <div className="bg-surface/5 backdrop-blur-xl border border-border/10 rounded-[2.5rem] p-8 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-black text-primary">Rol laboral</h2>
                        <p className="text-tertiary text-sm">
                            Actual: <span data-testid="current-role" className="font-bold text-accent-text">{selectedRole ? ROLE_LABELS[selectedRole] : 'Sin elegir'}</span>
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setRoleModalOpen(true)}
                        className="bg-accent text-primary px-6 py-3 rounded-2xl font-black shadow-lg hover:brightness-110 active:scale-95 transition-all"
                    >
                        Cambiar rol
                    </button>
                </div>
                {roleModalOpen && <RoleSelectionModal open onClose={() => setRoleModalOpen(false)} />}

                {/* Suscripción */}
                <section aria-labelledby="sub-title" className="bg-surface/5 backdrop-blur-xl border border-border/10 rounded-[2rem] p-6 flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h2 id="sub-title" className="text-xl font-black text-primary">Suscripción</h2>
                        <p className="text-sm text-tertiary">
                            {isPremium
                                ? `Licencia Pro activa${licenseInfo ? ` · ${licenseInfo.email}` : ''}`
                                : 'Versión gratuita. Activa tu clave o consigue el Pase Pro.'}
                        </p>
                    </div>
                    <UpgradeProButton label={isPremium ? 'Gestionar Pro' : 'Activar Pro'} />
                </section>

                {/* TTS Diagnostic Section */}
                <div className="bg-surface/5 backdrop-blur-xl border border-border/10 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute -right-20 -top-20 w-64 h-64 bg-accent opacity-5 blur-3xl rounded-full"></div>

                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-accent/20 rounded-2xl text-accent-text">
                            <BeakerIcon className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-primary">Laboratorio de Voces</h2>
                            <p className="text-tertiary text-xs uppercase tracking-widest font-semibold">Diagnóstico de Text-to-Speech (TTS)</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-1 space-y-6">
                            <div className="bg-background/20 rounded-3xl p-6 border border-border/5">
                                <h3 className="text-sm font-black text-primary mb-4 uppercase tracking-tighter flex items-center gap-2">
                                    <CommandLineIcon className="w-4 h-4 text-accent-text" />
                                    Estado del Sistema
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center bg-surface/5 p-3 rounded-xl">
                                        <span className="text-xs text-tertiary">Voces Totales</span>
                                        <span className="text-sm font-black text-primary">{allVoices.length}</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-surface/5 p-3 rounded-xl">
                                        <span className="text-xs text-tertiary">
                                            {targetLanguage === 'eu' ? 'Voces de Euskera' : 'Voces de Inglés'}
                                        </span>
                                        <span className={`text-sm font-black ${(targetLanguage === 'eu' ? basqueVoices : englishVoices).length > 0 ? 'text-success-text' : 'text-error-text'}`}>
                                            {(targetLanguage === 'eu' ? basqueVoices : englishVoices).length}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center bg-surface/5 p-3 rounded-xl">
                                        <span className="text-xs text-tertiary">Idioma Actual</span>
                                        <span className="text-sm font-black text-accent-text uppercase">{targetLanguage}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] uppercase font-semibold text-tertiary tracking-widest ml-2">Frase de Prueba</label>
                                <textarea
                                    className="w-full p-4 bg-surface/5 border border-border/10 rounded-2xl text-sm text-primary focus:ring-2 focus:ring-accent outline-none min-h-[100px] transition-all"
                                    value={testText}
                                    onChange={(e) => setTestText(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={async () => {
                                        setIsTesting(true);
                                        try {
                                            await playAudio(testText, targetLanguage === 'eu' ? 'eu' : 'en', { rate: 1, pitch: 1 });
                                        } finally {
                                            setIsTesting(false);
                                        }
                                    }}
                                    disabled={isTesting}
                                    className="w-full py-3 px-4 bg-accent text-primary rounded-xl font-bold flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-md disabled:opacity-50"
                                >
                                    <SpeakerWaveIcon className="w-5 h-5" />
                                    <span>{isTesting ? 'Reproduciendo...' : `Probar motor TTS (${targetLanguage === 'eu' ? 'Euskera' : 'Inglés'})`}</span>
                                </button>
                            </div>
                        </div>

                        <div className="lg:col-span-2 space-y-6">
                            <h3 className="text-sm font-bold text-primary uppercase tracking-widest ml-2">Voces Disponibles en tu Navegador</h3>

                            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {recommendedVoices.length > 0 && (
                                    <div className="mb-4">
                                        <p className="text-[10px] text-accent-text font-bold mb-2 uppercase tracking-widest">Recomendadas (Euskera)</p>
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
                                    <p className="text-[10px] text-tertiary font-bold mb-2 uppercase tracking-widest">Resto de Voces del Sistema</p>
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

                {/* Transferencia P2P (PM-05) */}
                <section aria-labelledby="transfer-title" className="bg-surface/5 border border-border/10 rounded-[2rem] p-8">
                    <h4 id="transfer-title" className="text-xl font-black text-primary mb-2">Cambiar de dispositivo</h4>
                    <p className="text-tertiary text-sm mb-4">Lleva tu racha, licencia y progreso a otro móvil u ordenador sin cuentas ni servidores.</p>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button onClick={() => setTransferMode('send')} className="px-5 py-3 rounded-xl bg-accent text-primary font-black">Pasar a otro dispositivo</button>
                        <button onClick={() => setTransferMode('receive')} className="px-5 py-3 rounded-xl bg-surface/10 text-primary font-black">Recibir desde otro dispositivo</button>
                    </div>
                </section>
                {transferMode && <DeviceTransferModal mode={transferMode} onClose={() => setTransferMode(null)} />}

                {/* Info Card */}
                <div className="bg-accent/10 border border-accent/20 rounded-[2rem] p-8 flex items-start gap-6">
                    <div className="p-3 bg-accent rounded-2xl">
                        <ExclamationTriangleIcon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h4 className="text-xl font-black text-primary mb-2">¿No escuchas nada?</h4>
                        <p className="text-tertiary text-sm leading-relaxed">
                            El Euskera no suele venir instalado por defecto en muchos navegadores.
                            En **Linux**, asegúrate de tener instalados los paquetes `speech-dispatcher` y voces de `espeak-ng` o similares.
                            En **Android/Chrome**, comprueba que los datos de voz de Google estén descargados.
                        </p>
                    </div>
                </div>

            </div>

        </PageContainer>
    );
};

const VoiceCard = ({ voice, onTest, isTesting }: { voice: SpeechSynthesisVoice, onTest: (uri: string) => void, isTesting: boolean }) => (
    <div className="flex items-center justify-between p-4 bg-surface/5 border border-border/5 rounded-2xl hover:bg-surface/10 transition-all group">
        <div className="flex flex-col">
            <span className="text-sm font-bold text-primary group-hover:text-accent-text transition-colors">{voice.name}</span>
            <span className="text-[10px] text-tertiary font-mono">{voice.lang} {voice.localService ? '(Local)' : '(Network)'}</span>
        </div>
        <button
            onClick={() => onTest(voice.voiceURI)}
            disabled={isTesting}
            className="p-3 bg-surface/5 rounded-xl text-primary hover:bg-accent hover:scale-110 active:scale-95 transition-all disabled:opacity-30"
        >
            <SpeakerWaveIcon className="w-5 h-5" />
        </button>
    </div>
);

export default Settings;
