"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useReplyStore } from "@/stores/reply-store";
import { usePendingMessages } from "@/stores/pending-messages-store";
import { CornerUpLeft, X, ArrowUp } from "lucide-react";

const supabase = createClient();

export default function MessageComposer({
  channelId,
  channelName,
  currentUserId,
  currentUserName,
  displayName,
}: {
  channelId: string;
  channelName: string;
  currentUserId: string;
  currentUserName: string;
  displayName?: string | null;
}) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const presenceChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(
    null,
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { replyTo, clearReplyTo } = useReplyStore();
  const { addPending } = usePendingMessages();

  useEffect(() => {
    if (replyTo) setTimeout(() => textareaRef.current?.focus(), 0);
  }, [replyTo]);

  useEffect(() => {
    const channel = supabase.channel(`typing:${channelId}`);
    channel.subscribe();
    presenceChannelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelId]);

  function broadcastTyping(isTyping: boolean) {
    presenceChannelRef.current?.track({
      user_id: currentUserId,
      name: currentUserName,
      typing: isTyping,
      hazard_thinking: false,
    });
  }

  function broadcastHazardThinking(isThinking: boolean) {
    presenceChannelRef.current?.track({
      user_id: currentUserId,
      name: currentUserName,
      typing: false,
      hazard_thinking: isThinking,
    });
  }

  async function getChannelContext(): Promise<string> {
    const { data } = await supabase
      .from("messages")
      .select("content, profiles(display_name, username)")
      .eq("channel_id", channelId)
      .is("thread_id", null)
      .eq("is_ai", false)
      .order("created_at", { ascending: false })
      .limit(10);
    if (!data?.length) return "";
    return data
      .reverse()
      .map((m) => {
        const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
        return `${profile?.display_name ?? profile?.username ?? "Unknown"}: ${m.content}`;
      })
      .join("\n");
  }

  async function sendAiMessage(prompt: string, parentId: string | null) {
    broadcastHazardThinking(true);
    const channelContext = await getChannelContext();
    const response = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: prompt }],
        channelContext,
      }),
    });
    broadcastHazardThinking(false);
    if (!response.ok || !response.body) return;
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      fullContent += decoder.decode(value, { stream: true });
    }
    await supabase
      .from("messages")
      .insert({
        channel_id: channelId,
        user_id: currentUserId,
        content: fullContent,
        is_ai: true,
        parent_message_id: parentId,
      });
  }

  async function sendMessage() {
    if (!message.trim() || sending) return;
    broadcastTyping(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    const text = replyTo
      ? `@${replyTo.username} ${message.trim()}`
      : message.trim();
    const tempId = crypto.randomUUID();

    // Optimistic — show instantly
    addPending({
      tempId,
      content: text,
      userId: currentUserId,
      channelId,
      createdAt: new Date().toISOString(),
      displayName: displayName ?? null,
      username: currentUserName,
    });

    setMessage("");
    clearReplyTo();
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setSending(true);

    if (text.toLowerCase().startsWith("@hazard")) {
      const { data: userMsg } = await supabase
        .from("messages")
        .insert({
          channel_id: channelId,
          user_id: currentUserId,
          content: text,
        })
        .select("id")
        .single();
      await sendAiMessage(text.slice(7).trim(), userMsg?.id ?? null);
    } else {
      await supabase
        .from("messages")
        .insert({
          channel_id: channelId,
          user_id: currentUserId,
          content: text,
        });
    }

    setSending(false);
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setMessage(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${e.target.scrollHeight}px`;
    broadcastTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => broadcastTyping(false), 2000);
  }

  async function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Escape" && replyTo) {
      clearReplyTo();
      setMessage("");
      return;
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      await sendMessage();
    }
  }

  return (
    <div className="shrink-0 border-t border-zinc-800">
      {replyTo && (
        <div className="flex items-center justify-between gap-2 px-4 py-2 border-b border-zinc-800/60 bg-zinc-900/20">
          <div className="flex items-center gap-2 min-w-0">
            <CornerUpLeft size={11} className="text-zinc-500 shrink-0" />
            <span className="text-[11px] text-zinc-500 shrink-0">
              Replying to{" "}
              <span className="text-zinc-300 font-medium">
                @{replyTo.username}
              </span>
            </span>
            <span className="text-[11px] text-zinc-600 truncate">
              — {replyTo.content}
            </span>
          </div>
          <button
            onClick={() => {
              clearReplyTo();
              setMessage("");
            }}
            className="text-zinc-600 hover:text-zinc-400 transition-colors shrink-0"
          >
            <X size={12} />
          </button>
        </div>
      )}

      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex-1 relative flex items-center">
          {message === "" && (
            <div className="absolute inset-0 pointer-events-none text-sm leading-normal select-none flex items-center">
              <span className="text-zinc-700">Message #{channelName} · </span>
              <span className="text-zinc-600">@hazard</span>
              <span className="text-zinc-700"> to ask AI</span>
            </div>
          )}
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            rows={1}
            className="relative w-full bg-transparent text-sm text-zinc-100 resize-none outline-none max-h-48 overflow-y-auto"
          />
        </div>
        <button
          onClick={sendMessage}
          disabled={!message.trim() || sending}
          className="shrink-0 w-7 h-7 flex items-center justify-center border border-zinc-700 hover:border-zinc-500 bg-white hover:bg-zinc-100 disabled:bg-transparent disabled:border-zinc-800 disabled:text-zinc-700 text-black transition-colors"
        >
          <ArrowUp size={14} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
