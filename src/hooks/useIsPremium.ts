import { useAppStore } from '../store/useAppStore';
import { useShallow } from 'zustand/react/shallow';

export const useIsPremium = (): boolean =>
  useAppStore(useShallow((state) => state.isPremium));
