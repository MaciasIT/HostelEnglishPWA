import { useAppStore } from '../store/useAppStore';
import { useShallow } from 'zustand/react/shallow';

export const useIsPremium = (): boolean =>
  useAppStore(
    useShallow((state) => {
      if (!state.isPremium) return false;
      if (state.licenseInfo?.expiresAt && Date.now() > state.licenseInfo.expiresAt) {
        return false;
      }
      return true;
    })
  );

