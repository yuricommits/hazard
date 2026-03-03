"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useThreadStore } from "@/stores/thread-store";
import { createClient } from "@/lib/supabase/client";
import MessageContent from "@/components/chat/message-content";
import { getOrCreateThread } from "@/lib/supabase/threads";
import { X, MessageSquare, ArrowUp } from "lucide-react";

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
          setReplies((prev) => [
            ...prev,
            { ...(payload.new as Message), profiles: profile },
          ]);
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
    if (!reply.trim() || sending || !openMessageId) return;
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
    let threadId = openThreadId;
    if (!threadId) {
      threadId = await getOrCreateThread(openMessageId, user.id);
      if (!threadId) return;
      useThreadStore.getState().setThreadId(threadId);
    }
    await supabase
      .from("messages")
      .insert({
        channel_id: parentMessage.channel_id,
        user_id: user.id,
        content: reply.trim(),
        thread_id: threadId,
      });
    setReply("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
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
        width: openMessageId ? 300 : 0,
        opacity: openMessageId ? 1 : 0,
      }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="border-l border-zinc-800 flex flex-col shrink-0 overflow-hidden bg-black"
    >
      {openMessageId && (
        <>
          {/* Header */}
          <div className="h-12 border-b border-zinc-800 flex items-center justify-between px-4 shrink-0">
            <div className="flex items-center gap-2">
              <MessageSquare
                size={13}
                strokeWidth={1.5}
                className="text-zinc-600"
              />
              <span className="text-sm font-medium text-zinc-200">Thread</span>
              {replies.length > 0 && (
                <span className="text-[11px] text-zinc-600">
                  {replies.length} {replies.length === 1 ? "reply" : "replies"}
                </span>
              )}
            </div>
            <button
              onClick={closeThread}
              className="w-7 h-7 flex items-center justify-center text-zinc-600 hover:text-zinc-300 hover:bg-zinc-900/40 transition-colors border border-transparent hover:border-zinc-800"
            >
              <X size={14} />
            </button>
          </div>

          {/* Replies */}
          <div className="flex-1 overflow-y-auto flex flex-col">
            {replies.length === 0 && (
              <div className="flex flex-col items-center gap-2 mt-10">
                <MessageSquare
                  size={20}
                  strokeWidth={1}
                  className="text-zinc-800"
                />
                <p className="text-xs text-zinc-600">No replies yet</p>
              </div>
            )}
            {replies.map((r) => (
              <div
                key={r.id}
                className="flex items-start gap-2.5 px-4 py-3 border-b border-zinc-800/20 hover:bg-zinc-900/20 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 text-xs font-medium text-zinc-400">
                  {r.profiles?.display_name?.[0]?.toUpperCase() ?? "?"}
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-baseline gap-2 mb-0.5">
                    <span className="text-xs font-medium text-zinc-200">
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

          {/* Composer */}
          <div className="border-t border-zinc-800 shrink-0">
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="shrink-0 relative flex items-center justify-center w-5 h-5">
                <div className="w-2 h-2 bg-white rotate-45 shadow-[0_0_6px_rgba(255,255,255,0.5)]" />
              </div>
              <textarea
                ref={textareaRef}
                value={reply}
                onChange={(e) => {
                  setReply(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                onKeyDown={handleKeyDown}
                placeholder="Reply..."
                rows={1}
                className="flex-1 bg-transparent text-sm text-zinc-100 placeholder:text-zinc-700 resize-none outline-none max-h-32 overflow-y-auto"
              />
              <button
                onClick={sendReply}
                disabled={!reply.trim() || sending}
                className="shrink-0 w-7 h-7 flex items-center justify-center border border-zinc-700 hover:border-zinc-500 bg-white hover:bg-zinc-100 disabled:bg-transparent disabled:border-zinc-800 disabled:text-zinc-700 text-black transition-colors"
              >
                <ArrowUp size={14} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </>
      )}
    </motion.aside>
  );
}
