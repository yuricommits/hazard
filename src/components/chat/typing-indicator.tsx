"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

type PresenceUser = {
  user_id: string;
  name: string;
  typing: boolean;
  hazard_thinking: boolean;
};

export default function TypingIndicator({
  channelId,
  currentUserId,
}: {
  channelId: string;
  currentUserId: string;
}) {
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [hazardThinking, setHazardThinking] = useState(false);

  useEffect(() => {
    const channel = supabase.channel(`typing:${channelId}`);

    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState<PresenceUser>();
      const allUsers = Object.values(state).flat();

      // Check if anyone has hazard_thinking: true
      const isThinking = allUsers.some((u) => u.hazard_thinking);
      setHazardThinking(isThinking);

      // Regular typing users (excluding current user and anyone with hazard_thinking active)
      const typing = allUsers
        .filter(
          (u) => u.typing && !u.hazard_thinking && u.user_id !== currentUserId,
        )
        .map((u) => u.name);

      setTypingUsers([...new Set(typing)]);
    });

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelId, currentUserId]);

  // Hazard thinking takes priority over regular typing indicators
  if (hazardThinking) {
    return (
      <div className="px-5 pb-1 flex items-center gap-1.5">
        <div className="flex items-center gap-0.5">
          <span className="w-1 h-1 rounded-full bg-violet-500 animate-bounce [animation-delay:0ms]" />
          <span className="w-1 h-1 rounded-full bg-violet-500 animate-bounce [animation-delay:150ms]" />
          <span className="w-1 h-1 rounded-full bg-violet-500 animate-bounce [animation-delay:300ms]" />
        </div>
        <span className="text-[11px] bg-linear-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent font-medium">
          Hazard is thinking...
        </span>
      </div>
    );
  }

  if (typingUsers.length === 0) return null;

  function formatTyping(names: string[]) {
    if (names.length === 1) return `${names[0]} is typing...`;
    if (names.length === 2) return `${names[0]} and ${names[1]} are typing...`;
    return "Several people are typing...";
  }

  return (
    <div className="px-5 pb-1 flex items-center gap-1.5">
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
