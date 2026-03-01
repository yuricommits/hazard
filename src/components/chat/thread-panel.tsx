"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useThreadStore } from "@/stores/thread-store";
import { createClient } from "@/lib/supabase/client";
import MessageContent from "@/components/chat/message-content";

const supabase = createClient();

const MIN_WIDTH = 240;
const MAX_WIDTH = 520;
const DEFAULT_WIDTH = 288;

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
  const [panelWidth, setPanelWidth] = useState(DEFAULT_WIDTH);
  const [isDragging, setIsDragging] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Drag refs — avoids circular useCallback dependency
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(DEFAULT_WIDTH);
  const handleMouseMove = useRef<(e: MouseEvent) => void>(() => {});
  const handleMouseUp = useRef<(e: MouseEvent) => void>(() => {});

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

  function onDragHandleMouseDown(e: React.MouseEvent) {
    e.preventDefault();
    dragStartX.current = e.clientX;
    dragStartWidth.current = panelWidth;
    setIsDragging(true);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    handleMouseMove.current = (ev: MouseEvent) => {
      const delta = dragStartX.current - ev.clientX;
      const newWidth = Math.min(
        MAX_WIDTH,
        Math.max(MIN_WIDTH, dragStartWidth.current + delta),
      );
      setPanelWidth(newWidth);
    };

    handleMouseUp.current = () => {
      setIsDragging(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", handleMouseMove.current);
      window.removeEventListener("mouseup", handleMouseUp.current);
    };

    window.addEventListener("mousemove", handleMouseMove.current);
    window.addEventListener("mouseup", handleMouseUp.current);
  }

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
        width: openThreadId ? panelWidth : 0,
        opacity: openThreadId ? 1 : 0,
      }}
      transition={
        isDragging
          ? { duration: 0 }
          : { type: "spring", stiffness: 300, damping: 30 }
      }
      className="border-l border-zinc-800 flex flex-col shrink-0 overflow-hidden relative"
    >
      {openThreadId && (
        <>
          {/* Drag handle — left edge */}
          <div
            onMouseDown={onDragHandleMouseDown}
            className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize z-10 group"
          >
            <div
              className={`absolute left-0 top-0 bottom-0 w-px transition-colors duration-150 ${
                isDragging
                  ? "bg-violet-500"
                  : "bg-transparent group-hover:bg-violet-500/50"
              }`}
            />
          </div>

          {/* Header */}
          <div className="h-12 border-b border-zinc-800 flex items-center justify-between px-4 shrink-0">
            <div className="flex items-center gap-2">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-zinc-500 shrink-0"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span className="text-sm font-semibold text-zinc-50">Thread</span>
              {replies.length > 0 && (
                <span className="text-[11px] text-zinc-600">
                  {replies.length} {replies.length === 1 ? "reply" : "replies"}
                </span>
              )}
            </div>
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
              <div className="flex flex-col items-center gap-2 mt-8">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-zinc-700"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <p className="text-xs text-zinc-600">No replies yet</p>
                <p className="text-[11px] text-zinc-700">
                  Be the first to reply
                </p>
              </div>
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
