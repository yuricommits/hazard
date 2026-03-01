"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useThreadStore } from "@/stores/thread-store";
import { getOrCreateThread } from "@/lib/supabase/threads";

const supabase = createClient();

type ActiveThread = {
  messageId: string;
  content: string;
  username: string;
  replyCount: number;
};

export default function ThreadsButton({ channelId }: { channelId: string }) {
  const [open, setOpen] = useState(false);
  const [threads, setThreads] = useState<ActiveThread[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { openThread } = useThreadStore();

  useEffect(() => {
    async function fetchThreads() {
      const { data: threadRows } = await supabase
        .from("threads")
        .select("id, message_id")
        .order("created_at", { ascending: false });

      if (!threadRows?.length) return;

      const messageIds = threadRows.map((t) => t.message_id);

      const { data: msgs } = await supabase
        .from("messages")
        .select("id, content, profiles(username, display_name)")
        .in("id", messageIds)
        .eq("channel_id", channelId);

      if (!msgs?.length) return;

      const threadIds = threadRows.map((t) => t.id);
      const { data: replies } = await supabase
        .from("messages")
        .select("thread_id")
        .in("thread_id", threadIds);

      const countByThread: Record<string, number> = {};
      replies?.forEach((r) => {
        if (r.thread_id)
          countByThread[r.thread_id] = (countByThread[r.thread_id] ?? 0) + 1;
      });

      const result: ActiveThread[] = threadRows
        .map((t) => {
          const msg = msgs.find((m) => m.id === t.message_id);
          if (!msg) return null;
          const profile = Array.isArray(msg.profiles)
            ? msg.profiles[0]
            : msg.profiles;
          return {
            messageId: t.message_id,
            content:
              msg.content.slice(0, 80) + (msg.content.length > 80 ? "…" : ""),
            username: profile?.display_name ?? profile?.username ?? "Unknown",
            replyCount: countByThread[t.id] ?? 0,
          };
        })
        .filter(Boolean) as ActiveThread[];

      setThreads(result);
    }

    fetchThreads();
  }, [channelId]);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  async function handleOpenThread(messageId: string) {
    setOpen(false);
    openThread(null, messageId);
    const threadId = await getOrCreateThread(messageId, "");
    if (threadId) useThreadStore.getState().setThreadId(threadId);
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded hover:bg-zinc-800 transition-colors ${
          open
            ? "text-zinc-200 bg-zinc-800"
            : "text-zinc-500 hover:text-zinc-300"
        }`}
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
        Threads
        {threads.length > 0 && (
          <span className="text-[10px] font-medium text-violet-400 bg-violet-500/10 border border-violet-500/20 rounded-full px-1.5 py-px">
            {threads.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-80 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-30 overflow-hidden">
          <div className="px-3 py-2.5 border-b border-zinc-800">
            <p className="text-xs font-medium text-zinc-400">Active threads</p>
          </div>

          {threads.length === 0 ? (
            <p className="text-xs text-zinc-600 text-center py-6">
              No threads in this channel yet
            </p>
          ) : (
            <div className="flex flex-col divide-y divide-zinc-800">
              {threads.map((t) => (
                <button
                  key={t.messageId}
                  onClick={() => handleOpenThread(t.messageId)}
                  className="flex flex-col gap-1 px-3 py-2.5 hover:bg-zinc-800 transition-colors text-left"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-violet-400">
                      @{t.username}
                    </span>
                    <span className="text-[10px] text-zinc-600">
                      {t.replyCount} {t.replyCount === 1 ? "reply" : "replies"}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 truncate">{t.content}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
