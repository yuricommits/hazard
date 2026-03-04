import { create } from "zustand";

type BootStore = {
  hasBooted: boolean;
  setBooted: () => void;
};

export const useBootStore = create<BootStore>((set) => ({
  hasBooted: false,
  setBooted: () => set({ hasBooted: true }),
}));
