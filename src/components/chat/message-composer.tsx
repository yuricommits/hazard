"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useReplyStore } from "@/stores/reply-store";
import { CornerUpLeft, X, ArrowUp } from "lucide-react";

const supabase = createClient();

export default function MessageComposer({
  channelId,
  channelName,
  currentUserId,
  currentUserName,
}: {
  channelId: string;
  channelName: string;
  currentUserId: string;
  currentUserName: string;
}) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const presenceChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(
    null,
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { replyTo, clearReplyTo } = useReplyStore();

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
        const name = profile?.display_name ?? profile?.username ?? "Unknown";
        return `${name}: ${m.content}`;
      })
      .join("\n");
  }

  async function sendAiMessage(prompt: string) {
    const { data: userMessage } = await supabase
      .from("messages")
      .insert({
        channel_id: channelId,
        user_id: currentUserId,
        content: message.trim(),
      })
      .select("id")
      .single();

    const parentMessageId = userMessage?.id ?? null;
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

    await supabase.from("messages").insert({
      channel_id: channelId,
      user_id: currentUserId,
      content: fullContent,
      is_ai: true,
      parent_message_id: parentMessageId,
    });
  }

  async function sendMessage() {
    if (!message.trim() || sending) return;
    broadcastTyping(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    setSending(true);

    const text = replyTo
      ? `@${replyTo.username} ${message.trim()}`
      : message.trim();
    setMessage("");
    clearReplyTo();
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    if (text.toLowerCase().startsWith("@hazard")) {
      const prompt = text.slice(7).trim();
      await sendAiMessage(prompt);
    } else {
      await supabase.from("messages").insert({
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
    <div className="px-4 pb-4 shrink-0">
      <div
        className={`bg-zinc-900 border rounded-xl transition-colors ${replyTo ? "border-violet-500/30" : "border-zinc-800 focus-within:border-zinc-700"}`}
      >
        {/* Reply bar */}
        {replyTo && (
          <div className="flex items-center justify-between gap-2 px-3 pt-2.5 pb-2 border-b border-zinc-800">
            <div className="flex items-center gap-2 min-w-0">
              <CornerUpLeft size={11} className="text-violet-400 shrink-0" />
              <span className="text-[11px] text-zinc-500 shrink-0">
                Replying to{" "}
                <span className="text-violet-400 font-medium">
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

        {/* Textarea */}
        <div className="relative px-3 pt-3 pb-2">
          {message === "" && (
            <div className="absolute inset-0 px-3 pt-3 pointer-events-none text-sm leading-normal select-none">
              <span className="text-zinc-600">Message #{channelName} · </span>
              <span className="text-violet-500/60">@hazard</span>
              <span className="text-zinc-600"> to ask AI</span>
            </div>
          )}
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            rows={1}
            className="relative w-full bg-transparent text-sm text-zinc-50 resize-none outline-none max-h-48 overflow-y-auto"
          />
        </div>

        {/* Bottom bar */}
        <div className="flex items-center justify-end px-2 pb-2">
          <button
            onClick={sendMessage}
            disabled={!message.trim() || sending}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-white hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-600 text-black transition-colors disabled:cursor-not-allowed"
          >
            <ArrowUp size={14} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      <p className="text-[10px] text-zinc-700 mt-1.5 px-1">
        Enter to send · Shift+Enter for new line · @hazard for AI
        {replyTo && " · Esc to cancel reply"}
      </p>
    </div>
  );
}
