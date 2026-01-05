import { create } from 'zustand';

interface BarryPanelStore {
  isOpen: boolean;
  activeSessionId: string | null;
  openPanel: () => void;
  closePanel: () => void;
  togglePanel: () => void;
  setActiveSessionId: (sessionId: string | null) => void;
}

export const useBarryPanelStore = create<BarryPanelStore>((set) => ({
  isOpen: false,
  activeSessionId: null,
  openPanel: () => set({ isOpen: true }),
  closePanel: () => set({ isOpen: false }),
  togglePanel: () => set((state) => ({ isOpen: !state.isOpen })),
  setActiveSessionId: (sessionId) => set({ activeSessionId: sessionId }),
}));
