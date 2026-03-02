import { create } from "zustand";

type MembersPanelStore = {
  isOpen: boolean;
  openMembers: () => void;
  closeMembers: () => void;
  toggleMembers: () => void;
};

export const useMembersPanelStore = create<MembersPanelStore>((set) => ({
  isOpen: false,
  openMembers: () => set({ isOpen: true }),
  closeMembers: () => set({ isOpen: false }),
  toggleMembers: () => set((s) => ({ isOpen: !s.isOpen })),
}));
