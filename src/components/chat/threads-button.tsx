"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useThreadStore } from "@/stores/thread-store";
import { MessageSquare } from "lucide-react";

const supabase = createClient();

type ActiveThread = {
  threadId: string;
  messageId: string;
  content: string;
  username: string;
  replyCount: number;
};

export default function ThreadsButton({ channelId }: { channelId: string }) {
  const [open, setOpen] = useState(false);
  const [threads, setThreads] = useState<ActiveThread[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { openThread, setThreadId } = useThreadStore();

  async function fetchThreads() {
    const { data: threadRows } = await supabase
      .from("threads")
      .select("id, message_id")
      .order("created_at", { ascending: false });

    if (!threadRows?.length) {
      setThreads([]);
      return;
    }

    const messageIds = threadRows.map((t) => t.message_id);
    const { data: msgs } = await supabase
      .from("messages")
      .select("id, content, profiles(username, display_name)")
      .in("id", messageIds)
      .eq("channel_id", channelId);

    if (!msgs?.length) {
      setThreads([]);
      return;
    }

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
          threadId: t.id,
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

  useEffect(() => {
    fetchThreads();
    const channel = supabase
      .channel(`threads-button:${channelId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "threads" },
        () => fetchThreads(),
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          if (payload.new.thread_id) fetchThreads();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      )
        setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  function handleOpenThread(thread: ActiveThread) {
    setOpen(false);
    openThread(thread.threadId, thread.messageId);
    setThreadId(thread.threadId);
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 h-7 px-2.5 rounded-md text-xs transition-colors ${
          open
            ? "text-zinc-200 bg-zinc-800"
            : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
        }`}
      >
        <MessageSquare size={12} strokeWidth={1.75} />
        Threads
        {threads.length > 0 && (
          <span className="text-[10px] font-medium text-zinc-400 bg-zinc-800 border border-zinc-700 rounded-full px-1.5 py-px">
            {threads.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-80 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl z-30 overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-800">
            <p className="text-xs font-medium text-zinc-400">Active threads</p>
          </div>

          {threads.length === 0 ? (
            <p className="text-xs text-zinc-600 text-center py-8">
              No threads yet
            </p>
          ) : (
            <div className="flex flex-col divide-y divide-zinc-800/60">
              {threads.map((t) => (
                <button
                  key={t.messageId}
                  onClick={() => handleOpenThread(t)}
                  className="flex flex-col gap-1 px-4 py-3 hover:bg-zinc-900 transition-colors text-left"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-300">
                      {t.username}
                    </span>
                    <span className="text-[10px] text-zinc-600">
                      {t.replyCount} {t.replyCount === 1 ? "reply" : "replies"}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 truncate">{t.content}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
