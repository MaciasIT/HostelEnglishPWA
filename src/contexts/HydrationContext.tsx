import { createContext, useContext, ReactNode } from 'react';

interface HydrationContextValue {
  isHydrating: boolean;
}

export const HydrationContext = createContext<HydrationContextValue>({
  isHydrating: true,
});

export const useHydration = (): HydrationContextValue => useContext(HydrationContext);

interface HydrationProviderProps {
  isHydrating: boolean;
  children: ReactNode;
}

export const HydrationProvider: React.FC<HydrationProviderProps> = ({ isHydrating, children }) => (
  <HydrationContext.Provider value={{ isHydrating }}>
    {children}
  </HydrationContext.Provider>
);
