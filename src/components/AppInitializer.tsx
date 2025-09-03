import React, { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';

interface AppInitializerProps {
  children: React.ReactNode;
}

const AppInitializer: React.FC<AppInitializerProps> = ({ children }) => {
  const loadFrases = useAppStore((state) => state.loadFrases);
  const loadConversations = useAppStore((state) => state.loadConversations);

  useEffect(() => {
    loadFrases();
    loadConversations();
  }, [loadFrases, loadConversations]);

  return <>{children}</>;
};

export default AppInitializer;
