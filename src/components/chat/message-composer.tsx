"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

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

  // Set up presence channel on mount
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

    // Reverse so oldest is first, build readable context string
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
    // 1. Save the user's @hazard message to the channel
    await supabase.from("messages").insert({
      channel_id: channelId,
      user_id: currentUserId,
      content: message.trim(),
    });

    // 2. Show "Hazard is thinking..." to everyone
    broadcastHazardThinking(true);

    // 3. Fetch channel context
    const channelContext = await getChannelContext();

    // 4. Call the AI API
    const response = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: prompt }],
        channelContext,
      }),
    });

    if (!response.ok || !response.body) {
      broadcastHazardThinking(false);
      return;
    }

    // 5. Stop "thinking" indicator — response is starting
    broadcastHazardThinking(false);

    // 6. Stream the response and collect full content
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      fullContent += decoder.decode(value, { stream: true });
    }

    // 7. Save the complete AI response to the database
    await supabase.from("messages").insert({
      channel_id: channelId,
      user_id: currentUserId,
      content: fullContent,
      is_ai: true,
    });
  }

  async function sendMessage() {
    if (!message.trim() || sending) return;

    broadcastTyping(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    setSending(true);
    const text = message.trim();
    setMessage("");

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    // Detect @hazard mention
    if (text.toLowerCase().startsWith("@hazard")) {
      const prompt = text.slice(7).trim(); // strip "@hazard" prefix
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
    typingTimeoutRef.current = setTimeout(() => {
      broadcastTyping(false);
    }, 2000);
  }

  async function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      await sendMessage();
    }
  }

  return (
    <div className="px-4 pb-4 shrink-0">
      <div className="border border-zinc-800 rounded-lg px-4 py-3 focus-within:border-zinc-700 transition-colors">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={`Message #${channelName} · @hazard to ask AI`}
          rows={1}
          className="w-full bg-transparent text-sm text-zinc-50 placeholder:text-zinc-600 resize-none outline-none max-h-48 overflow-y-auto"
        />
      </div>
      <p className="text-[10px] text-zinc-600 mt-1.5 px-1">
        Enter to send · Shift+Enter for new line · @hazard for AI
      </p>
    </div>
  );
}
