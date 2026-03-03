"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useThreadStore } from "@/stores/thread-store";
import { getOrCreateThread } from "@/lib/supabase/threads";
import { MessageSquare } from "lucide-react";

const supabase = createClient();

type ThreadPreview = {
  id: string;
  messageId: string;
  messageContent: string;
  replyCount: number;
  lastReplyAt: string;
  authorName: string;
};

export default function ThreadsButton({ channelId }: { channelId: string }) {
  const [open, setOpen] = useState(false);
  const [threads, setThreads] = useState<ThreadPreview[]>([]);
  const [loading, setLoading] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const { openThread } = useThreadStore();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function fetchThreads() {
    setLoading(true);
    const { data: threadData } = await supabase
      .from("threads")
      .select(
        "id, message_id, messages!threads_message_id_fkey(content, profiles(display_name, username))",
      )
      .eq("channel_id", channelId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (!threadData) {
      setLoading(false);
      return;
    }

    const previews: ThreadPreview[] = await Promise.all(
      threadData.map(async (t) => {
        const { count } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("thread_id", t.id);

        const { data: lastReply } = await supabase
          .from("messages")
          .select("created_at")
          .eq("thread_id", t.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        const msg = Array.isArray(t.messages) ? t.messages[0] : t.messages;
        const profile = msg?.profiles
          ? Array.isArray(msg.profiles)
            ? msg.profiles[0]
            : msg.profiles
          : null;

        return {
          id: t.id,
          messageId: t.message_id,
          messageContent: msg?.content ?? "",
          replyCount: count ?? 0,
          lastReplyAt: lastReply?.created_at ?? "",
          authorName: profile?.display_name ?? profile?.username ?? "Unknown",
        };
      }),
    );

    setThreads(previews.filter((p) => p.replyCount > 0));
    setLoading(false);
  }

  function handleToggle() {
    if (!open) fetchThreads();
    setOpen((prev) => !prev);
  }

  async function handleOpenThread(messageId: string) {
    setOpen(false);
    openThread(null, messageId);
    const threadId = await getOrCreateThread(messageId, "");
    if (threadId) useThreadStore.getState().setThreadId(threadId);
  }

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={handleToggle}
        title="Threads"
        className={`w-full h-full flex items-center justify-center transition-colors ${
          open
            ? "text-zinc-200 bg-zinc-900/40"
            : "text-zinc-600 hover:text-zinc-300 hover:bg-zinc-900/30"
        }`}
      >
        <MessageSquare size={13} strokeWidth={1.75} />
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-0 w-72 bg-black border border-zinc-800 shadow-2xl z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-zinc-800">
            <span className="text-xs font-medium text-zinc-300">Threads</span>
            <span className="text-[10px] text-zinc-600">
              {threads.length} active
            </span>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <span className="text-xs text-zinc-600">Loading...</span>
              </div>
            ) : threads.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8">
                <MessageSquare
                  size={18}
                  strokeWidth={1}
                  className="text-zinc-800"
                />
                <span className="text-xs text-zinc-600">No threads yet</span>
              </div>
            ) : (
              threads.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleOpenThread(t.messageId)}
                  className="w-full flex flex-col gap-1 px-3 py-3 border-b border-zinc-800/50 hover:bg-zinc-900/30 transition-colors text-left"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-medium text-zinc-400 truncate">
                      {t.authorName}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      <MessageSquare
                        size={10}
                        strokeWidth={1.5}
                        className="text-zinc-600"
                      />
                      <span className="text-[10px] text-zinc-600">
                        {t.replyCount}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
                    {t.messageContent}
                  </p>
                  {t.lastReplyAt && (
                    <span className="text-[10px] text-zinc-700">
                      {new Date(t.lastReplyAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
