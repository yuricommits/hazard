"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useThreadStore } from "@/stores/thread-store";
import { createClient } from "@/lib/supabase/client";
import MessageContent from "@/components/chat/message-content";
import { getOrCreateThread } from "@/lib/supabase/threads";
import { X, MessageSquare, ArrowUp } from "lucide-react";

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

    await supabase.from("messages").insert({
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
        width: openMessageId ? panelWidth : 0,
        opacity: openMessageId ? 1 : 0,
      }}
      transition={
        isDragging
          ? { duration: 0 }
          : { type: "spring", stiffness: 300, damping: 30 }
      }
      className="border-l border-zinc-800 flex flex-col shrink-0 overflow-hidden relative bg-black"
    >
      {openMessageId && (
        <>
          {/* Drag handle */}
          <div
            onMouseDown={onDragHandleMouseDown}
            className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize z-10 group"
          >
            <div
              className={`absolute left-0 top-0 bottom-0 w-px transition-colors duration-150 ${isDragging ? "bg-zinc-600" : "bg-transparent group-hover:bg-zinc-700"}`}
            />
          </div>

          {/* Header */}
          <div className="h-12 flex items-center justify-between px-4 shrink-0 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <MessageSquare
                size={13}
                strokeWidth={1.5}
                className="text-zinc-500"
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
              className="w-7 h-7 flex items-center justify-center rounded-md text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          {/* Replies */}
          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
            {replies.length === 0 && (
              <div className="flex flex-col items-center gap-2 mt-10">
                <MessageSquare
                  size={20}
                  strokeWidth={1}
                  className="text-zinc-800"
                />
                <p className="text-xs text-zinc-600">No replies yet</p>
                <p className="text-[11px] text-zinc-700">
                  Be the first to reply
                </p>
              </div>
            )}
            {replies.map((r) => (
              <div key={r.id} className="flex items-start gap-2.5">
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
          <div className="p-3 shrink-0">
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl focus-within:border-zinc-700 transition-colors">
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
                className="w-full bg-transparent text-sm text-zinc-100 placeholder:text-zinc-600 resize-none outline-none max-h-32 overflow-y-auto px-3 pt-3 pb-2"
              />
              <div className="flex items-center justify-end px-2 pb-2">
                <button
                  onClick={sendReply}
                  disabled={!reply.trim() || sending}
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-white hover:bg-zinc-200 disabled:bg-zinc-900 disabled:text-zinc-700 text-black transition-colors disabled:cursor-not-allowed"
                >
                  <ArrowUp size={14} strokeWidth={2.5} />
                </button>
              </div>
            </div>
            <p className="text-[10px] text-zinc-700 mt-1.5 px-1">
              Enter to reply · Shift+Enter for new line
            </p>
          </div>
        </>
      )}
    </motion.aside>
  );
}
