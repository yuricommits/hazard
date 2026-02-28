import { create } from "zustand";

type ThreadStore = {
  openThreadId: string | null;
  openMessageId: string | null;
  openThread: (threadId: string, messageId: string) => void;
  closeThread: () => void;
};

export const useThreadStore = create<ThreadStore>((set) => ({
  openThreadId: null,
  openMessageId: null,
  openThread: (threadId, messageId) =>
    set({ openThreadId: threadId, openMessageId: messageId }),
  closeThread: () => set({ openThreadId: null, openMessageId: null }),
}));

// What this does:

// Stores which thread is currently open globally
// openThread — call this when user clicks Reply, pass the thread and message IDs
// closeThread — call this when user closes the panel
// Any component in the app can read or update this state without prop drilling
