import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type LeadListVariant = 'table' | 'cards' | 'responsive';
export type SortOption = 'newest' | 'oldest' | 'source' | 'status';

interface UIState {
  leadListVariant: LeadListVariant;
  leadSortBy: SortOption;
  setLeadListVariant: (v: LeadListVariant) => void;
  setLeadSortBy: (s: SortOption) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      leadListVariant: 'responsive',
      leadSortBy: 'newest',
      setLeadListVariant: (v) => set({ leadListVariant: v }),
      setLeadSortBy: (s) => set({ leadSortBy: s }),
    }),
    { name: 'px-ui' }
  )
);
