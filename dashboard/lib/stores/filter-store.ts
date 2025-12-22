import { create } from 'zustand';

interface FilterState {
  showRenewalsOnly: boolean;
  setShowRenewalsOnly: (value: boolean) => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  showRenewalsOnly: false,
  setShowRenewalsOnly: (value) => set({ showRenewalsOnly: value }),
}));
