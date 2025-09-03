import React, { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';

interface AppInitializerProps {
  children: React.ReactNode;
}

const AppInitializer: React.FC<AppInitializerProps> = ({ children }) => {
  const loadFrases = useAppStore((state) => state.loadFrases);
  const loadConversations = useAppStore((state) => state.loadConversations);
  const frasesLoaded = useAppStore((state) => state.frasesLoaded);
  const conversationsLoaded = useAppStore((state) => state.conversationsLoaded);

  useEffect(() => {
    if (!frasesLoaded) {
      loadFrases();
    }
    if (!conversationsLoaded) {
      loadConversations();
    }
  }, [loadFrases, loadConversations, frasesLoaded, conversationsLoaded]);

  if (!frasesLoaded || !conversationsLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500 dark:text-gray-400">Cargando datos iniciales...</p>
      </div>
    );
  }

  return <>{children}</>;
};

export default AppInitializer;
