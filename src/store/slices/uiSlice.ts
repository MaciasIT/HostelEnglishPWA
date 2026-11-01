import { StateCreator } from 'zustand';

export interface UISlice {
  /** Drawer abierto (móvil: overlay; tablet: rail expandido como overlay) */
  isSideNavOpen: boolean;
  /** Desktop (≥1280px): SideNav colapsado (w-20) o expandido (w-72). Persistido. */
  isSideNavCollapsed: boolean;
  toggleSideNav: () => void;
  closeSideNav: () => void;
  toggleSideNavCollapsed: () => void;
}

export const createUISlice: StateCreator<UISlice> = (set) => ({
  isSideNavOpen: false,
  isSideNavCollapsed: false,
  toggleSideNav: () => set((state) => ({ isSideNavOpen: !state.isSideNavOpen })),
  closeSideNav: () => set({ isSideNavOpen: false }),
  toggleSideNavCollapsed: () => set((state) => ({ isSideNavCollapsed: !state.isSideNavCollapsed })),
});
