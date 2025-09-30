import { useEffect } from 'react';
import InstallPWAButton from './InstallPWAButton';
import { useAppStore } from '@/store/useAppStore';

const AppInitializer = () => {
  const { frasesLoaded, conversationsLoaded, initializeCategories, loadFrases, loadConversations } = useAppStore();

  useEffect(() => {
    if (!frasesLoaded) {
      loadFrases();
    }
    if (!conversationsLoaded) {
      loadConversations();
    }
  }, []); // El array vacío asegura que esto se ejecute solo una vez

  useEffect(() => {
    if (frasesLoaded && conversationsLoaded) {
      initializeCategories();
    }
  }, [frasesLoaded, conversationsLoaded, initializeCategories]);

  return <InstallPWAButton />;
};

export default AppInitializer;
