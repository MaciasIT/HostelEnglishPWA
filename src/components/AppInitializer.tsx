import { useEffect, useState } from 'react';
import InstallPWAButton from './InstallPWAButton';
import { useAppStore } from '@/store/useAppStore';

const AppInitializer = () => {
    const [hasHydrated, setHasHydrated] = useState(false);
    const { frasesLoaded, conversationsLoaded, initializeCategories, loadFrases, loadConversations } = useAppStore();

    useEffect(() => {
        const unsub = useAppStore.persist.onFinishHydration(() => {
            setHasHydrated(true);
        });
        
        // Si ya hidrató (ej. HMR)
        if (useAppStore.persist.hasHydrated()) setHasHydrated(true);

        return () => unsub();
    }, []);

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

    if (!hasHydrated) {
        return (
            <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-primary-dark text-white p-6">
                <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin mb-6"></div>
                <h2 className="text-2xl font-black tracking-tighter uppercase mb-2">Sincronizando</h2>
                <p className="text-gray-400 text-sm animate-pulse">Optimizando base de datos y progreso...</p>
            </div>
        );
    }

    return <InstallPWAButton />;
};

export default AppInitializer;
