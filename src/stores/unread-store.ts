import { create } from "zustand";
import { persist } from "zustand/middleware";

type UnreadStore = {
  // channelId → ISO timestamp of last time user viewed that channel
  lastRead: Record<string, string>;
  markRead: (channelId: string) => void;
  getHasUnread: (channelId: string, lastMessageAt: string | null) => boolean;
};

export const useUnreadStore = create<UnreadStore>()(
  persist(
    (set, get) => ({
      lastRead: {},

      markRead: (channelId) => {
        set((s) => ({
          lastRead: { ...s.lastRead, [channelId]: new Date().toISOString() },
        }));
      },

      getHasUnread: (channelId, lastMessageAt) => {
        if (!lastMessageAt) return false;
        const lastRead = get().lastRead[channelId];
        // Never visited → has unread if there are any messages
        if (!lastRead) return true;
        return new Date(lastMessageAt) > new Date(lastRead);
      },
    }),
    {
      name: "hazard-unread",
    },
  ),
);
