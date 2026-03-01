"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useThreadStore } from "@/stores/thread-store";
import { createClient } from "@/lib/supabase/client";
import MessageContent from "@/components/chat/message-content";

const supabase = createClient();

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
  thread_id: string | null;
  profiles: Profile | null;
};

export default function ThreadPanel() {
  const { openThreadId, openMessageId, closeThread } = useThreadStore();
  const [replies, setReplies] = useState<Message[]>([]);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openThreadId) return;

    async function fetchReplies() {
      const { data } = await supabase
        .from("messages")
        .select("*, profiles(id, username, display_name, avatar_url)")
        .eq("thread_id", openThreadId)
        .order("created_at", { ascending: true });

      setReplies(data ?? []);
    }

    fetchReplies();

    const channel = supabase
      .channel(`thread:${openThreadId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `thread_id=eq.${openThreadId}`,
        },
        async (payload) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("id, username, display_name, avatar_url")
            .eq("id", payload.new.user_id)
            .single();

          const newReply: Message = {
            ...(payload.new as Message),
            profiles: profile,
          };

          setReplies((prev) => [...prev, newReply]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [openThreadId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [replies]);

  async function sendReply() {
    if (!reply.trim() || sending || !openThreadId) return;
    setSending(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: parentMessage } = await supabase
      .from("messages")
      .select("channel_id")
      .eq("id", openMessageId)
      .single();

    if (!parentMessage) return;

    await supabase.from("messages").insert({
      channel_id: parentMessage.channel_id,
      user_id: user.id,
      content: reply.trim(),
      thread_id: openThreadId,
    });

    setReply("");
    setSending(false);
  }

  async function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      await sendReply();
    }
  }

  return (
    <motion.aside
      animate={{
        width: openThreadId ? 288 : 0,
        opacity: openThreadId ? 1 : 0,
      }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="border-l border-zinc-800 flex flex-col shrink-0 overflow-hidden"
    >
      {openThreadId && (
        <>
          {/* Header */}
          <div className="h-12 border-b border-zinc-800 flex items-center justify-between px-4 shrink-0">
            <span className="text-sm font-semibold text-zinc-50">Thread</span>
            <button
              onClick={closeThread}
              className="text-zinc-500 hover:text-zinc-300 transition-colors text-lg leading-none"
            >
              ×
            </button>
          </div>

          {/* Replies */}
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1">
            {replies.length === 0 && (
              <p className="text-xs text-zinc-600 text-center mt-4">
                No replies yet
              </p>
            )}
            {replies.map((r) => (
              <div
                key={r.id}
                className="flex items-start gap-2 px-2 py-1 rounded-lg hover:bg-zinc-900/50"
              >
                <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center shrink-0 text-xs font-medium text-zinc-400">
                  {r.profiles?.display_name?.[0]?.toUpperCase() ?? "?"}
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-medium text-zinc-50">
                      {r.profiles?.display_name ??
                        r.profiles?.username ??
                        "Unknown"}
                    </span>
                    <span className="text-[10px] text-zinc-600">
                      {new Date(r.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <MessageContent content={r.content} />
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Reply composer */}
          <div className="p-3 shrink-0">
            <div className="border border-zinc-800 rounded-lg px-3 py-2 focus-within:border-zinc-700 transition-colors">
              <textarea
                value={reply}
                onChange={(e) => {
                  setReply(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                onKeyDown={handleKeyDown}
                placeholder="Reply..."
                rows={1}
                className="w-full bg-transparent text-sm text-zinc-50 placeholder:text-zinc-600 resize-none outline-none max-h-32 overflow-y-auto"
              />
            </div>
            <p className="text-[10px] text-zinc-600 mt-1 px-1">
              Enter to reply · Shift+Enter for new line
            </p>
          </div>
        </>
      )}
    </motion.aside>
  );
}
