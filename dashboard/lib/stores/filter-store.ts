import { create } from 'zustand';

interface FilterState {
  showRenewalsOnly: boolean;
  setShowRenewalsOnly: (value: boolean) => void;
  selectedCsm: string | null;
  setSelectedCsm: (csm: string | null) => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  showRenewalsOnly: false,
  setShowRenewalsOnly: (value) => set({ showRenewalsOnly: value }),
  selectedCsm: null,
  setSelectedCsm: (csm) => set({ selectedCsm: csm }),
}));
