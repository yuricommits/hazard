"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import MessageContent from "@/components/chat/message-content";
import AiMessage from "@/components/chat/ai-message";
import { useThreadStore } from "@/stores/thread-store";
import { useReplyStore } from "@/stores/reply-store";
import { getOrCreateThread } from "@/lib/supabase/threads";
import ReactionButton from "@/components/chat/reaction-button";
import MessageContextMenu from "@/components/chat/message-context-menu";
import { usePresenceStore } from "@/stores/presence-store";
import { useMessageStore, Message } from "@/stores/message-store";
import { useProfileCache } from "@/stores/profile-cache-store";
import { MessageSquare, RefreshCw } from "lucide-react";

const supabase = createClient();

type ContextMenu = { x: number; y: number; message: Message };

function isGrouped(messages: Message[], index: number): boolean {
  if (index === 0) return false;
  const prev = messages[index - 1];
  const curr = messages[index];
  if (prev.user_id !== curr.user_id) return false;
  if (prev.is_ai || curr.is_ai) return false;
  if (prev.isPending || prev.isFailed) return false;
  return (
    new Date(curr.created_at).getTime() - new Date(prev.created_at).getTime() <
    5 * 60 * 1000
  );
}

function truncate(text: string, max = 80) {
  return text.length > max ? text.slice(0, max) + "…" : text;
}

export default function MessageFeed({
  channelId,
  channelName,
  initialMessages,
  currentUserId,
}: {
  channelId: string;
  channelName: string;
  initialMessages: Message[];
  currentUserId: string;
}) {
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevLengthRef = useRef(0);

  const { openThread } = useThreadStore();
  const { setReplyTo } = useReplyStore();
  const onlineUserIds = usePresenceStore((s) => s.onlineUserIds);
  const { seedProfiles, fetchProfile } = useProfileCache();

  const {
    seedChannel,
    refreshChannel,
    realtimeInsert,
    setReactions,
    removeReaction,
    incrementReplyCount,
    toggleReaction,
    retryMessage,
  } = useMessageStore();

  // Stable selectors — ?? [] outside selector to avoid new reference each render
  const messages = useMessageStore((s) => s.cache[channelId]) ?? [];
  const isCached = useMessageStore((s) => !!s.loaded[channelId]);

  // Seed or refresh on channel change
  useEffect(() => {
    const profiles = initialMessages
      .map((m) => m.profiles)
      .filter((p): p is NonNullable<typeof p> => p !== null);
    if (profiles.length) seedProfiles(profiles);

    if (!isCached) {
      seedChannel(channelId, initialMessages);
      setTimeout(
        () => bottomRef.current?.scrollIntoView({ behavior: "instant" }),
        0,
      );
    } else {
      refreshChannel(channelId, initialMessages);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId]);

  // Scroll on new messages
  useEffect(() => {
    if (messages.length > prevLengthRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevLengthRef.current = messages.length;
  }, [messages.length]);

  // Fetch reply counts in background
  useEffect(() => {
    async function fetchReplyCounts() {
      const messageIds = initialMessages.map((m) => m.id);
      if (!messageIds.length) return;
      const { data: threads } = await supabase
        .from("threads")
        .select("id, message_id")
        .in("message_id", messageIds);
      if (!threads?.length) return;
      const threadIds = threads.map((t) => t.id);
      const { data: replies } = await supabase
        .from("messages")
        .select("thread_id")
        .in("thread_id", threadIds);
      if (!replies?.length) return;
      const countByThread: Record<string, number> = {};
      replies.forEach((r) => {
        if (r.thread_id)
          countByThread[r.thread_id] = (countByThread[r.thread_id] ?? 0) + 1;
      });
      threads.forEach((t) => {
        useMessageStore
          .getState()
          .setReplyCount(channelId, t.message_id, countByThread[t.id] ?? 0);
      });
    }
    fetchReplyCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId]);

  // Realtime messages
  useEffect(() => {
    const channel = supabase
      .channel(`messages:${channelId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `channel_id=eq.${channelId}`,
        },
        async (payload) => {
          if (payload.new.thread_id) {
            const { data: thread } = await supabase
              .from("threads")
              .select("message_id")
              .eq("id", payload.new.thread_id)
              .single();
            if (thread) incrementReplyCount(channelId, thread.message_id);
            return;
          }
          const profile = await fetchProfile(payload.new.user_id);
          realtimeInsert(channelId, {
            ...(payload.new as Message),
            profiles: profile,
            reactions: [],
            replyCount: 0,
          });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelId, fetchProfile, realtimeInsert, incrementReplyCount]);

  // Realtime reactions
  useEffect(() => {
    const channel = supabase
      .channel(`reactions:${channelId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "reactions" },
        async (payload) => {
          const { data } = await supabase
            .from("reactions")
            .select("id, emoji, user_id")
            .eq("message_id", payload.new.message_id);
          if (data) setReactions(channelId, payload.new.message_id, data);
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "reactions" },
        (payload) => removeReaction(channelId, payload.old.id),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelId, setReactions, removeReaction]);

  function handleReply(message: Message) {
    const username =
      message.profiles?.display_name ?? message.profiles?.username ?? "Unknown";
    setReplyTo({
      messageId: message.id,
      content: truncate(message.content),
      username,
    });
  }

  function handleContextMenu(e: React.MouseEvent, message: Message) {
    if (message.isPending || message.isFailed) return;
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, message });
  }

  async function handleReact(messageId: string, emoji: string) {
    toggleReaction(channelId, messageId, emoji, currentUserId);
    const msg = useMessageStore
      .getState()
      .getMessages(channelId)
      .find((m) => m.id === messageId);
    const existing = msg?.reactions.find(
      (r) => r.emoji === emoji && r.user_id === currentUserId,
    );
    if (existing) {
      await supabase.from("reactions").delete().eq("id", existing.id);
    } else {
      await supabase
        .from("reactions")
        .insert({ message_id: messageId, user_id: currentUserId, emoji });
    }
  }

  async function handleViewThread(messageId: string) {
    openThread(null, messageId);
    const threadId = await getOrCreateThread(messageId, currentUserId);
    if (threadId) useThreadStore.getState().setThreadId(threadId);
  }

  const aiResponseMap = messages.reduce<Record<string, Message>>((acc, m) => {
    if (m.is_ai && m.parent_message_id) acc[m.parent_message_id] = m;
    return acc;
  }, {});

  const topLevel = messages.filter((m) => !(m.is_ai && m.parent_message_id));

  return (
    <div className="flex-1 overflow-y-auto flex flex-col bg-black">
      {topLevel.length === 0 && (
        <div className="flex items-center justify-center h-full">
          <p className="text-sm text-zinc-700">Beginning of #{channelName}</p>
        </div>
      )}

      {topLevel.map((message, index) => {
        const grouped = isGrouped(topLevel, index);

        if (message.is_ai && !message.isPending) {
          return <AiMessage key={message.id} content={message.content} />;
        }

        const aiResponse = aiResponseMap[message.id];
        const hasThread = message.replyCount > 0;
        const isOnline = onlineUserIds.has(message.user_id);

        return (
          <div
            key={message.id}
            onContextMenu={(e) => handleContextMenu(e, message)}
            className={`flex flex-col border-b border-zinc-800/20 transition-opacity duration-150 ${
              message.isPending
                ? "opacity-50"
                : message.isFailed
                  ? "opacity-40"
                  : "opacity-100 hover:bg-zinc-900/10"
            }`}
          >
            <div
              className={`flex items-start gap-3 px-4 ${
                grouped ? "py-0.5" : "pt-3 pb-1"
              }`}
            >
              {grouped ? (
                <div className="w-8 shrink-0" />
              ) : (
                <div className="relative shrink-0 mt-0.5">
                  <div
                    className={`w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xs font-medium text-zinc-400 ${
                      message.isPending ? "animate-pulse" : ""
                    }`}
                  >
                    {message.profiles?.display_name?.[0]?.toUpperCase() ?? "?"}
                  </div>
                  {isOnline && !message.isPending && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border-2 border-black" />
                  )}
                </div>
              )}

              <div className="flex flex-col min-w-0 flex-1 pb-1">
                {!grouped && (
                  <div className="flex items-baseline gap-2 mb-0.5">
                    <span className="text-sm font-medium text-zinc-100">
                      {message.profiles?.display_name ??
                        message.profiles?.username ??
                        "Unknown"}
                    </span>
                    <span className="text-[10px] text-zinc-600">
                      {new Date(message.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {message.isPending && (
                      <span className="text-[10px] text-zinc-700">
                        sending…
                      </span>
                    )}
                    {message.isFailed && (
                      <span className="text-[10px] text-red-600">
                        failed to send
                      </span>
                    )}
                  </div>
                )}

                <MessageContent content={message.content} />

                {message.isFailed && message.tempId && (
                  <button
                    onClick={() => retryMessage(channelId, message.tempId!)}
                    className="mt-1 flex items-center gap-1 text-[10px] text-red-600 hover:text-red-400 transition-colors"
                  >
                    <RefreshCw size={9} />
                    Retry
                  </button>
                )}

                {!message.isPending && !message.isFailed && (
                  <ReactionButton
                    messageId={message.id}
                    reactions={message.reactions ?? []}
                    currentUserId={currentUserId}
                  />
                )}

                {hasThread && !message.isPending && (
                  <button
                    onClick={() => handleViewThread(message.id)}
                    className="mt-1.5 flex items-center gap-1.5 text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors w-fit border border-zinc-800/60 px-2 py-1 hover:border-zinc-700"
                  >
                    <MessageSquare size={11} strokeWidth={1.5} />
                    {message.replyCount}{" "}
                    {message.replyCount === 1 ? "reply" : "replies"}
                  </button>
                )}
              </div>
            </div>

            {aiResponse && (
              <div className="ml-11 pl-4 border-l-2 border-zinc-800/40 mx-4 my-1">
                <AiMessage content={aiResponse.content} />
              </div>
            )}
          </div>
        );
      })}

      <div ref={bottomRef} />

      {contextMenu && (
        <MessageContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          hasThread={contextMenu.message.replyCount > 0}
          onCloseAction={() => setContextMenu(null)}
          onReplyAction={() => handleReply(contextMenu.message)}
          onThreadAction={() => openThread(null, contextMenu.message.id)}
          onReactAction={(emoji: string) =>
            handleReact(contextMenu.message.id, emoji)
          }
        />
      )}
    </div>
  );
}
