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
    });
  }

  async function sendMessage() {
    if (!message.trim() || sending) return;

    // Clear typing indicator immediately on send
    broadcastTyping(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    setSending(true);

    const { error } = await supabase.from("messages").insert({
      channel_id: channelId,
      user_id: currentUserId,
      content: message.trim(),
    });

    if (!error) {
      setMessage("");
    }

    setSending(false);
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setMessage(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${e.target.scrollHeight}px`;

    // Broadcast typing: true
    broadcastTyping(true);

    // Reset the 2s debounce timer
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
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={`Message #${channelName}`}
          rows={1}
          className="w-full bg-transparent text-sm text-zinc-50 placeholder:text-zinc-600 resize-none outline-none max-h-48 overflow-y-auto"
        />
      </div>
      <p className="text-[10px] text-zinc-600 mt-1.5 px-1">
        Enter to send · Shift+Enter for new line
      </p>
    </div>
  );
}

// What this does:

// Enter sends the message, Shift+Enter adds a new line — standard chat behavior
// message.trim() — never sends empty or whitespace-only messages
// router.refresh() — after sending, refreshes the page to show the new message
// focus-within — the border subtly brightens when the textarea is focused

// What changed:

// On every keystroke, height resets to auto then grows to fit the content
// max-h-48 caps it at 192px — after that it scrolls instead of growing forever
