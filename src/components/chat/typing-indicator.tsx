"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

type PresenceUser = {
  user_id: string;
  name: string;
  typing: boolean;
};

export default function TypingIndicator({
  channelId,
  currentUserId,
}: {
  channelId: string;
  currentUserId: string;
}) {
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  useEffect(() => {
    const channel = supabase.channel(`typing:${channelId}`);

    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState<PresenceUser>();

      // Each key in state is a presence slot — flatten all users, filter for
      // those who are actively typing and aren't the current user
      const typing = Object.values(state)
        .flat()
        .filter((u) => u.typing && u.user_id !== currentUserId)
        .map((u) => u.name);

      // Deduplicate in case of multiple presence slots for same user
      setTypingUsers([...new Set(typing)]);
    });

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelId, currentUserId]);

  if (typingUsers.length === 0) return null;

  function formatTyping(names: string[]) {
    if (names.length === 1) return `${names[0]} is typing...`;
    if (names.length === 2) return `${names[0]} and ${names[1]} are typing...`;
    return "Several people are typing...";
  }

  return (
    <div className="px-5 pb-1 flex items-center gap-1.5">
      {/* Animated dots */}
      <div className="flex items-center gap-0.5">
        <span className="w-1 h-1 rounded-full bg-zinc-500 animate-bounce [animation-delay:0ms]" />
        <span className="w-1 h-1 rounded-full bg-zinc-500 animate-bounce [animation-delay:150ms]" />
        <span className="w-1 h-1 rounded-full bg-zinc-500 animate-bounce [animation-delay:300ms]" />
      </div>
      <span className="text-[11px] text-zinc-500">
        {formatTyping(typingUsers)}
      </span>
    </div>
  );
}
