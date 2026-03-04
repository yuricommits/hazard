import { create } from "zustand";

export type Profile = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
};

export type Reaction = {
  id: string;
  emoji: string;
  user_id: string;
};

export type Message = {
  id: string;
  tempId?: string;
  content: string;
  created_at: string;
  user_id: string;
  channel_id: string;
  thread_id: string | null;
  parent_message_id: string | null;
  is_ai: boolean;
  profiles: Profile | null;
  reactions: Reaction[];
  replyCount: number;
  isPending?: boolean;
  isFailed?: boolean;
};

type MessageStore = {
  cache: Record<string, Message[]>;
  loaded: Record<string, boolean>;

  getMessages: (channelId: string) => Message[];
  seedChannel: (channelId: string, messages: Message[]) => void;
  refreshChannel: (channelId: string, messages: Message[]) => void;
  addPending: (msg: Omit<Message, "id"> & { tempId: string }) => void;
  confirmMessage: (channelId: string, tempId: string, realId: string) => void;
  failMessage: (channelId: string, tempId: string) => void;
  retryMessage: (channelId: string, tempId: string) => void;
  realtimeInsert: (channelId: string, msg: Message) => void;
  setReactions: (
    channelId: string,
    messageId: string,
    reactions: Reaction[],
  ) => void;
  removeReaction: (channelId: string, reactionId: string) => void;
  toggleReaction: (
    channelId: string,
    messageId: string,
    emoji: string,
    userId: string,
  ) => void;
  setReplyCount: (channelId: string, messageId: string, count: number) => void;
  incrementReplyCount: (channelId: string, messageId: string) => void;
};

function patch(
  messages: Message[],
  predicate: (m: Message) => boolean,
  updater: (m: Message) => Message,
): Message[] {
  return messages.map((m) => (predicate(m) ? updater(m) : m));
}

export const useMessageStore = create<MessageStore>((set, get) => ({
  cache: {},
  loaded: {},

  getMessages: (channelId) => get().cache[channelId] ?? [],

  seedChannel: (channelId, messages) => {
    if (get().loaded[channelId]) return;
    set((s) => ({
      cache: {
        ...s.cache,
        [channelId]: messages.map((m) => ({
          ...m,
          replyCount: m.replyCount ?? 0,
        })),
      },
      loaded: { ...s.loaded, [channelId]: true },
    }));
  },

  refreshChannel: (channelId, messages) => {
    set((s) => {
      const existing = s.cache[channelId] ?? [];
      const existingIds = new Set(existing.map((m) => m.id));
      const pendingOrFailed = existing.filter((m) => m.isPending || m.isFailed);
      const incoming = messages
        .map((m) => ({ ...m, replyCount: m.replyCount ?? 0 }))
        .filter((m) => !existingIds.has(m.id));
      return {
        cache: {
          ...s.cache,
          [channelId]: [
            ...existing.filter((m) => !m.isPending && !m.isFailed),
            ...incoming,
            ...pendingOrFailed,
          ],
        },
      };
    });
  },

  addPending: (msg) => {
    set((s) => ({
      cache: {
        ...s.cache,
        [msg.channel_id]: [
          ...(s.cache[msg.channel_id] ?? []),
          { ...msg, id: msg.tempId, isPending: true, isFailed: false },
        ],
      },
    }));
  },

  confirmMessage: (channelId, tempId, realId) => {
    set((s) => ({
      cache: {
        ...s.cache,
        [channelId]: patch(
          s.cache[channelId] ?? [],
          (m) => m.id === tempId,
          (m) => ({
            ...m,
            id: realId,
            tempId,
            isPending: false,
            isFailed: false,
          }),
        ),
      },
    }));
  },

  failMessage: (channelId, tempId) => {
    set((s) => ({
      cache: {
        ...s.cache,
        [channelId]: patch(
          s.cache[channelId] ?? [],
          (m) => m.id === tempId,
          (m) => ({ ...m, isPending: false, isFailed: true }),
        ),
      },
    }));
  },

  retryMessage: (channelId, tempId) => {
    set((s) => ({
      cache: {
        ...s.cache,
        [channelId]: patch(
          s.cache[channelId] ?? [],
          (m) => m.id === tempId,
          (m) => ({ ...m, isPending: true, isFailed: false }),
        ),
      },
    }));
  },

  realtimeInsert: (channelId, msg) => {
    set((s) => {
      const existing = s.cache[channelId] ?? [];
      if (existing.some((m) => m.id === msg.id || m.tempId === msg.id))
        return s;
      return {
        cache: { ...s.cache, [channelId]: [...existing, msg] },
      };
    });
  },

  setReactions: (channelId, messageId, reactions) => {
    set((s) => ({
      cache: {
        ...s.cache,
        [channelId]: patch(
          s.cache[channelId] ?? [],
          (m) => m.id === messageId,
          (m) => ({ ...m, reactions }),
        ),
      },
    }));
  },

  removeReaction: (channelId, reactionId) => {
    set((s) => ({
      cache: {
        ...s.cache,
        [channelId]: (s.cache[channelId] ?? []).map((m) => ({
          ...m,
          reactions: m.reactions.filter((r) => r.id !== reactionId),
        })),
      },
    }));
  },

  toggleReaction: (channelId, messageId, emoji, userId) => {
    set((s) => ({
      cache: {
        ...s.cache,
        [channelId]: patch(
          s.cache[channelId] ?? [],
          (m) => m.id === messageId,
          (m) => {
            const existing = m.reactions.find(
              (r) => r.emoji === emoji && r.user_id === userId,
            );
            if (existing) {
              return {
                ...m,
                reactions: m.reactions.filter((r) => r.id !== existing.id),
              };
            }
            return {
              ...m,
              reactions: [
                ...m.reactions,
                { id: crypto.randomUUID(), emoji, user_id: userId },
              ],
            };
          },
        ),
      },
    }));
  },

  setReplyCount: (channelId, messageId, count) => {
    set((s) => ({
      cache: {
        ...s.cache,
        [channelId]: patch(
          s.cache[channelId] ?? [],
          (m) => m.id === messageId,
          (m) => ({ ...m, replyCount: count }),
        ),
      },
    }));
  },

  incrementReplyCount: (channelId, messageId) => {
    set((s) => ({
      cache: {
        ...s.cache,
        [channelId]: patch(
          s.cache[channelId] ?? [],
          (m) => m.id === messageId,
          (m) => ({ ...m, replyCount: m.replyCount + 1 }),
        ),
      },
    }));
  },
}));
