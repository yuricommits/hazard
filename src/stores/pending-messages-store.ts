import { create } from "zustand";

export type PendingMessage = {
  tempId: string;
  content: string;
  userId: string;
  channelId: string;
  createdAt: string;
  displayName: string | null;
  username: string;
};

type PendingStore = {
  pending: PendingMessage[];
  addPending: (msg: PendingMessage) => void;
  removePending: (tempId: string) => void;
};

export const usePendingMessages = create<PendingStore>((set) => ({
  pending: [],
  addPending: (msg) => set((s) => ({ pending: [...s.pending, msg] })),
  removePending: (tempId) =>
    set((s) => ({ pending: s.pending.filter((m) => m.tempId !== tempId) })),
}));
