import { useEffect, useState, useCallback, ReactNode } from 'react';
import InstallPWAButton from './InstallPWAButton';
import { useAppStore } from '@/store/useAppStore';
import { HydrationProvider } from '@/contexts/HydrationContext';
import { initNotifications } from '@/pushNotifications';
import { initSentry } from '@/monitoring/sentry';
import { initSync } from '@/services/syncService';

const HYDRATION_TIMEOUT_MS = 4000;

const AppInitializer = ({ children }: { children: ReactNode }) => {
    const [hasHydrated, setHasHydrated] = useState(false);
    const { frasesLoaded, conversationsLoaded, initializeCategories, loadFrases, loadConversations } = useAppStore();

    const finish = useCallback(() => {
        setHasHydrated(true);
    }, []);

    useEffect(() => {
        // Ocultar splash inline en el primer frame montado
        const splash = document.getElementById('splash');
        if (splash) {
          splash.classList.add('hidden');
          // Eliminar del DOM tras la transición para liberar recursos
          setTimeout(() => splash.remove(), 400);
        }
    }, []);

    useEffect(() => {
        const unsub = useAppStore.persist.onFinishHydration(() => {
            finish();
        });

        if (useAppStore.persist.hasHydrated()) {
            finish();
        }

        const timeout = setTimeout(() => {
            if (!hasHydrated) {
                console.warn('[AppInitializer] Hydration tardó demasiado, continuando sin bloqueo.');
                finish();
            }
        }, HYDRATION_TIMEOUT_MS);

        initNotifications();
        initSentry();
        initSync();

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

    return (
        <HydrationProvider isHydrating={!hasHydrated}>
            {children}
            <InstallPWAButton />
        </HydrationProvider>
    );
};

export default AppInitializer;
