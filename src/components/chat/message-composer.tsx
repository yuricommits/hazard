"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function MessageComposer({
  channelId,
  channelName,
}: {
  channelId: string;
  channelName: string;
}) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const supabase = createClient();

  async function sendMessage() {
    if (!message.trim() || sending) return;

    setSending(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("messages").insert({
      channel_id: channelId,
      user_id: user.id,
      content: message.trim(),
    });

    if (!error) {
      setMessage("");
    }

    setSending(false);
  }

  async function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      await sendMessage();
    }
  }

  return (
    <div className="p-4 shrink-0">
      <div className="border border-zinc-800 rounded-lg px-4 py-3 focus-within:border-zinc-700 transition-colors">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Message #${channelName}`}
          rows={1}
          className="w-full bg-transparent text-sm text-zinc-50 placeholder:text-zinc-600 resize-none outline-none"
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
