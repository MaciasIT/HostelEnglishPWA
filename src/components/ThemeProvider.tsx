import React from 'react';
import { useTheme } from '@/hooks/useTheme';

/** Monta el motor de temas una vez en la raíz de la app. */
const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useTheme();
  return <>{children}</>;
};

export default ThemeProvider;
