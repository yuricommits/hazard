"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import MessageContent from "@/components/chat/message-content";
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
  profiles: Profile | null;
  reactions: Reaction[];
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
  const [messages, setMessages] = useState<Message[]>(initialMessages);
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

  // What changed: Two separate effects now — the first one runs once on mount with instant so when you open a channel it jumps straight to the bottom without animation. The second runs every time messages change with smooth so new incoming messages scroll nicely.

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
          };

          setMessages((prev) => [...prev, newMessage]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelId]);

  return (
    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-1">
      {messages.length === 0 && (
        <div className="flex items-center justify-center h-full">
          <p className="text-sm text-zinc-500">
            This is the beginning of #{channelName}
          </p>
        </div>
      )}
      {messages.map((message) => (
        <div
          key={message.id}
          className="flex items-start gap-3 px-2 py-1 rounded-lg hover:bg-zinc-900/50 group relative"
        >
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
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
