import { StateCreator } from 'zustand';

export interface UISlice {
  isSideNavOpen: boolean;
  toggleSideNav: () => void;
  closeSideNav: () => void;
}

export const createUISlice: StateCreator<UISlice> = (set) => ({
  isSideNavOpen: false,
  toggleSideNav: () => set((state) => ({ isSideNavOpen: !state.isSideNavOpen })),
  closeSideNav: () => set({ isSideNavOpen: false }),
});
