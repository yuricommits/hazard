"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import MessageContent from "@/components/chat/message-content";
import AiMessage from "@/components/chat/ai-message";
import { useThreadStore } from "@/stores/thread-store";
import { getOrCreateThread } from "@/lib/supabase/threads";
import ReactionButton from "@/components/chat/reaction-button";

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

  async function handleReply(messageId: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const threadId = await getOrCreateThread(messageId, user.id);
    if (threadId) {
      openThread(threadId, messageId);
    }
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "instant" });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch reply counts for all visible messages on mount
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
        if (r.thread_id) {
          countByThread[r.thread_id] = (countByThread[r.thread_id] ?? 0) + 1;
        }
      });

      const countByMessage: Record<string, number> = {};
      threads.forEach((t) => {
        countByMessage[t.message_id] = countByThread[t.id] ?? 0;
      });

      setMessages((prev) =>
        prev.map((m) => ({
          ...m,
          replyCount: countByMessage[m.id] ?? 0,
        })),
      );
    }

    fetchReplyCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Subscription: new messages in this channel
  useEffect(() => {
    const channel = supabase
      .channel(`messages:${channelId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `channel_id=eq.${channelId}&thread_id=is.null`,
        },
        async (payload) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("id, username, display_name, avatar_url")
            .eq("id", payload.new.user_id)
            .single();

          const newMessage: Message = {
            ...(payload.new as Message),
            profiles: profile,
            reactions: [],
            replyCount: 0,
          };

          setMessages((prev) => [...prev, newMessage]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelId]);

  // Subscription: thread replies — increment reply count on parent message
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

  // Subscription: reaction inserts and deletes
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

  // Build a map of parentMessageId → AI response
  // AI messages with a parent_message_id are rendered grouped under their parent
  // AI messages without a parent_message_id are rendered standalone (legacy/manual inserts)
  const aiResponseMap = messages.reduce<Record<string, Message>>((acc, m) => {
    if (m.is_ai && m.parent_message_id) {
      acc[m.parent_message_id] = m;
    }
    return acc;
  }, {});

  // Only render top-level messages — skip AI messages that have a parent (they render inline)
  const topLevelMessages = messages.filter(
    (m) => !(m.is_ai && m.parent_message_id),
  );

  return (
    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-1">
      {messages.length === 0 && (
        <div className="flex items-center justify-center h-full">
          <p className="text-sm text-zinc-500">
            This is the beginning of #{channelName}
          </p>
        </div>
      )}
      {topLevelMessages.map((message) => {
        // Standalone AI messages (no parent — legacy or manual inserts)
        if (message.is_ai) {
          return <AiMessage key={message.id} content={message.content} />;
        }

        // Look up if this message has an AI response
        const aiResponse = aiResponseMap[message.id];

        // Regular human messages
        return (
          <div key={message.id} className="flex flex-col">
            <div className="flex items-start gap-3 px-2 py-1 rounded-lg hover:bg-zinc-900/50 group relative">
              {/* Hover actions */}
              <div className="absolute right-2 top-1 hidden group-hover:flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-md px-1 py-0.5">
                <button
                  onClick={() => handleReply(message.id)}
                  className="text-[11px] text-zinc-400 hover:text-zinc-50 px-1.5 py-0.5 rounded hover:bg-zinc-800 transition-colors"
                >
                  Reply
                </button>
              </div>

              <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center shrink-0 text-xs font-medium text-zinc-400">
                {message.profiles?.display_name?.[0]?.toUpperCase() ?? "?"}
              </div>

              <div className="flex flex-col min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium text-zinc-50">
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

                <MessageContent content={message.content} />

                <ReactionButton
                  messageId={message.id}
                  reactions={message.reactions ?? []}
                  currentUserId={currentUserId}
                />

                {/* Thread reply count */}
                {message.replyCount > 0 && (
                  <button
                    onClick={() => handleReply(message.id)}
                    className="mt-1 flex items-center gap-1.5 text-[11px] text-violet-400 hover:text-violet-300 hover:underline transition-colors w-fit"
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    {message.replyCount}{" "}
                    {message.replyCount === 1 ? "reply" : "replies"}
                  </button>
                )}
              </div>
            </div>

            {/* AI response grouped below — indented with a connector line */}
            {aiResponse && (
              <div className="ml-11 pl-4 border-l-2 border-zinc-800 mt-0.5 mb-1">
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
