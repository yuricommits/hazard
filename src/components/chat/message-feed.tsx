"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import MessageContent from "@/components/chat/message-content";
import AiMessage from "@/components/chat/ai-message";
import { useThreadStore } from "@/stores/thread-store";
import { useReplyStore } from "@/stores/reply-store";
import { getOrCreateThread } from "@/lib/supabase/threads";
import ReactionButton from "@/components/chat/reaction-button";
import { usePresenceStore } from "@/stores/presence-store";
import { CornerUpLeft, MessageSquare } from "lucide-react";

type Profile = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
};

type Reaction = {
  id: string;
  emoji: string;
  user_id: string;
};

type Message = {
  id: string;
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
};

const supabase = createClient();

function isGrouped(messages: Message[], index: number): boolean {
  if (index === 0) return false;
  const prev = messages[index - 1];
  const curr = messages[index];
  if (prev.user_id !== curr.user_id) return false;
  if (prev.is_ai || curr.is_ai) return false;
  const diff =
    new Date(curr.created_at).getTime() - new Date(prev.created_at).getTime();
  return diff < 5 * 60 * 1000;
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
  const [messages, setMessages] = useState<Message[]>(
    initialMessages.map((m) => ({ ...m, replyCount: 0 })),
  );
  const bottomRef = useRef<HTMLDivElement>(null);
  const { openThread } = useThreadStore();
  const { setReplyTo } = useReplyStore();
  const onlineUserIds = usePresenceStore((s) => s.onlineUserIds);

  function handleReply(message: Message) {
    const username =
      message.profiles?.display_name ?? message.profiles?.username ?? "Unknown";
    setReplyTo({
      messageId: message.id,
      content: truncate(message.content),
      username,
    });
  }

  function handleCreateThread(messageId: string) {
    openThread(null, messageId);
  }

  async function handleViewThread(messageId: string) {
    openThread(null, messageId);
    const threadId = await getOrCreateThread(messageId, currentUserId);
    if (threadId) useThreadStore.getState().setThreadId(threadId);
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "instant" });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    async function fetchReplyCounts() {
      const messageIds = messages.map((m) => m.id);
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
      const countByMessage: Record<string, number> = {};
      threads.forEach((t) => {
        countByMessage[t.message_id] = countByThread[t.id] ?? 0;
      });
      setMessages((prev) =>
        prev.map((m) => ({ ...m, replyCount: countByMessage[m.id] ?? 0 })),
      );
    }
    fetchReplyCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          if (payload.new.thread_id) return;
          const { data: profile } = await supabase
            .from("profiles")
            .select("id, username, display_name, avatar_url")
            .eq("id", payload.new.user_id)
            .single();
          setMessages((prev) => [
            ...prev,
            {
              ...(payload.new as Message),
              profiles: profile,
              reactions: [],
              replyCount: 0,
            },
          ]);
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelId]);

  useEffect(() => {
    const channel = supabase
      .channel(`thread-replies:${channelId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `channel_id=eq.${channelId}`,
        },
        async (payload) => {
          const threadId = payload.new.thread_id;
          if (!threadId) return;
          const { data: thread } = await supabase
            .from("threads")
            .select("message_id")
            .eq("id", threadId)
            .single();
          if (!thread) return;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === thread.message_id
                ? { ...m, replyCount: m.replyCount + 1 }
                : m,
            ),
          );
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelId]);

  useEffect(() => {
    const channel = supabase
      .channel(`reactions:${channelId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "reactions" },
        async (payload) => {
          const messageId = payload.new.message_id;
          const { data } = await supabase
            .from("reactions")
            .select("id, emoji, user_id")
            .eq("message_id", messageId);
          if (!data) return;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === messageId ? { ...msg, reactions: data } : msg,
            ),
          );
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "reactions" },
        (payload) => {
          const deletedId = payload.old.id;
          setMessages((prev) => {
            const messageId = prev.find((msg) =>
              msg.reactions.some((r) => r.id === deletedId),
            )?.id;
            if (!messageId) return prev;
            return prev.map((msg) =>
              msg.id === messageId
                ? {
                    ...msg,
                    reactions: msg.reactions.filter((r) => r.id !== deletedId),
                  }
                : msg,
            );
          });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelId]);

  const aiResponseMap = messages.reduce<Record<string, Message>>((acc, m) => {
    if (m.is_ai && m.parent_message_id) acc[m.parent_message_id] = m;
    return acc;
  }, {});

  const topLevelMessages = messages.filter(
    (m) => !(m.is_ai && m.parent_message_id),
  );

  return (
    <div className="flex-1 overflow-y-auto flex flex-col bg-black">
      {messages.length === 0 && (
        <div className="flex items-center justify-center h-full">
          <p className="text-sm text-zinc-700">Beginning of #{channelName}</p>
        </div>
      )}

      {topLevelMessages.map((message, index) => {
        const grouped = isGrouped(topLevelMessages, index);
        if (message.is_ai)
          return <AiMessage key={message.id} content={message.content} />;

        const aiResponse = aiResponseMap[message.id];
        const hasThread = message.replyCount > 0;

        return (
          <div
            key={message.id}
            className="flex flex-col border-b border-zinc-800/40"
          >
            <div
              className={`flex items-start gap-3 px-4 hover:bg-zinc-900/20 group relative ${grouped ? "py-0.5" : "pt-3 pb-1"}`}
            >
              {/* Hover actions */}
              <div className="absolute right-0 top-0 hidden group-hover:flex items-center border-l border-b border-zinc-800 bg-black z-10">
                <button
                  onClick={() => handleReply(message)}
                  className="flex items-center gap-1.5 h-8 px-3 text-xs text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900/40 transition-colors border-r border-zinc-800"
                >
                  <CornerUpLeft size={11} strokeWidth={2} />
                  Reply
                </button>
                {!hasThread && (
                  <button
                    onClick={() => handleCreateThread(message.id)}
                    className="flex items-center gap-1.5 h-8 px-3 text-xs text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900/40 transition-colors"
                  >
                    <MessageSquare size={11} strokeWidth={2} />
                    Thread
                  </button>
                )}
              </div>

              {/* Avatar */}
              {grouped ? (
                <div className="w-8 shrink-0 flex items-center justify-center">
                  <span className="text-[10px] text-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity">
                    {new Date(message.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ) : (
                <div className="relative shrink-0 mt-0.5">
                  <div className="w-8 h-8 border border-zinc-800 flex items-center justify-center text-xs font-medium text-zinc-400">
                    {message.profiles?.display_name?.[0]?.toUpperCase() ?? "?"}
                  </div>
                  {onlineUserIds.has(message.user_id) && (
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
                  </div>
                )}

                <MessageContent content={message.content} />

                <ReactionButton
                  messageId={message.id}
                  reactions={message.reactions ?? []}
                  currentUserId={currentUserId}
                />

                {hasThread && (
                  <button
                    onClick={() => handleViewThread(message.id)}
                    className="mt-1.5 flex items-center gap-1.5 text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors w-fit border border-zinc-800 px-2 py-1 hover:border-zinc-700"
                  >
                    <MessageSquare size={11} strokeWidth={1.5} />
                    {message.replyCount}{" "}
                    {message.replyCount === 1 ? "reply" : "replies"}
                  </button>
                )}
              </div>
            </div>

            {aiResponse && (
              <div className="ml-11 pl-4 border-l-2 border-zinc-800 mx-4 my-1">
                <AiMessage content={aiResponse.content} />
              </div>
            )}
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
