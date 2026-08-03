import { useEffect, useState, useCallback } from 'react';
import InstallPWAButton from './InstallPWAButton';
import { useAppStore } from '@/store/useAppStore';
import { initNotifications } from '@/pushNotifications';
import { initSentry } from '@/monitoring/sentry';

const HYDRATION_TIMEOUT_MS = 4000;
const BLACK_SCREEN_DELAY_MS = 2000;

const AppInitializer = () => {
    const [hasHydrated, setHasHydrated] = useState(false);
    const [recovery, setRecovery] = useState(false);
    const [blackScreen, setBlackScreen] = useState(false);
    const { frasesLoaded, conversationsLoaded, initializeCategories, loadFrases, loadConversations } = useAppStore();

    const finish = useCallback(() => {
        setHasHydrated(true);
        setRecovery(false);
        setBlackScreen(false);
    }, []);

    const reload = useCallback(() => {
        setRecovery(false);
        setBlackScreen(false);
        setHasHydrated(false);
        window.location.reload();
    }, []);

    const continueWithoutData = useCallback(async () => {
        await useAppStore.persist.clearStorage();
        reload();
    }, [reload]);

    useEffect(() => {
        const unsub = useAppStore.persist.onFinishHydration(() => {
            finish();
        });

        if (useAppStore.persist.hasHydrated()) {
            finish();
        }

        const timeout = setTimeout(() => {
            if (!hasHydrated) {
                setRecovery(true);
            }
        }, HYDRATION_TIMEOUT_MS);

        initNotifications();
        initSentry();

        return () => {
            unsub();
            clearTimeout(timeout);
        };
    }, [finish, hasHydrated]);

    useEffect(() => {
        if (!hasHydrated) return;

        if (!frasesLoaded) {
            loadFrases();
        }
        if (!conversationsLoaded) {
            loadConversations();
        }
    }, [hasHydrated, frasesLoaded, conversationsLoaded, loadFrases, loadConversations]);

    useEffect(() => {
        if (hasHydrated && frasesLoaded && conversationsLoaded) {
            initializeCategories();
        }
    }, [hasHydrated, frasesLoaded, conversationsLoaded, initializeCategories]);

    useEffect(() => {
        if (!recovery) return;

        const timer = setTimeout(() => {
            setBlackScreen(true);
        }, BLACK_SCREEN_DELAY_MS);

        const onVisibility = () => {
            if (document.visibilityState === 'visible' && hasHydrated) {
                setRecovery(false);
                setBlackScreen(false);
            }
        };

        document.addEventListener('visibilitychange', onVisibility);

        return () => {
            clearTimeout(timer);
            document.removeEventListener('visibilitychange', onVisibility);
        };
    }, [recovery, hasHydrated]);

    if (!hasHydrated && !recovery) {
        return (
            <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-primary-dark text-white p-6">
                <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin mb-6"></div>
                <h2 className="text-2xl font-black tracking-tighter uppercase mb-2">Sincronizando</h2>
                <p className="text-gray-400 text-sm animate-pulse">Optimizando base de datos y progreso...</p>
            </div>
        );
    }

    if (recovery && !blackScreen) {
        return (
            <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-primary-dark text-white p-6">
                <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin mb-6"></div>
                <h2 className="text-2xl font-black tracking-tighter uppercase mb-2">Sincronizando</h2>
                <p className="text-gray-400 text-sm animate-pulse">Optimizando base de datos y progreso...</p>
            </div>
        );
    }

    if (blackScreen) {
        return (
            <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-primary-dark text-white p-6">
                <h2 className="text-2xl font-black tracking-tighter uppercase mb-3">La app se ha quedado sin respuesta</h2>
                <p className="text-gray-400 text-sm mb-6 text-center max-w-md">
                    No se pudo recuperar el progreso en modo standalone. Puedes recargar o continuar sin datos guardados.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={reload}
                        className="px-4 py-2 rounded bg-accent text-white font-bold"
                    >
                        Recargar
                    </button>
                    <button
                        onClick={continueWithoutData}
                        className="px-4 py-2 rounded border border-white/20 text-white font-bold"
                    >
                        Continuar sin datos guardados
                    </button>
                </div>
            </div>
        );
    }

    return <InstallPWAButton />;
};

export default AppInitializer;
