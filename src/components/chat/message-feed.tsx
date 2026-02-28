"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Profile = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
};

type Message = {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  channel_id: string;
  profiles: Profile | null;
};

const supabase = createClient();

export default function MessageFeed({
  channelId,
  channelName,
  initialMessages,
}: {
  channelId: string;
  channelName: string;
  initialMessages: Message[];
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const bottomRef = useRef<HTMLDivElement>(null);
  // const supabase = createClient();

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
          filter: `channel_id=eq.${channelId}`,
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
          className="flex items-start gap-3 px-2 py-1 rounded-lg hover:bg-zinc-900/50 group"
        >
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
            <p className="text-sm text-zinc-300 wrap-break-word">
              {message.content}
            </p>
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
