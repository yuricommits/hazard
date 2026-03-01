import { create } from "zustand";

type ReplyTarget = {
  messageId: string;
  content: string;
  username: string;
};

type ReplyStore = {
  replyTo: ReplyTarget | null;
  setReplyTo: (target: ReplyTarget) => void;
  clearReplyTo: () => void;
};

export const useReplyStore = create<ReplyStore>((set) => ({
  replyTo: null,
  setReplyTo: (target) => set({ replyTo: target }),
  clearReplyTo: () => set({ replyTo: null }),
}));
