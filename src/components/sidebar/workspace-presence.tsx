// src/components/sidebar/workspace-presence.tsx
"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { usePresenceStore } from "@/stores/presence-store";

const supabase = createClient();

type PresencePayload = {
  user_id: string;
};

export default function WorkspacePresence({
  workspaceId,
  currentUserId,
}: {
  workspaceId: string;
  currentUserId: string;
}) {
  const setOnlineUserIds = usePresenceStore((s) => s.setOnlineUserIds);

  useEffect(() => {
    const channel = supabase.channel(`presence:${workspaceId}`, {
      config: { presence: { key: currentUserId } },
    });

    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState<PresencePayload>();
      const ids = new Set(Object.keys(state));
      setOnlineUserIds(ids);
    });

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({ user_id: currentUserId });
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId, currentUserId, setOnlineUserIds]);

  return null;
}

// What this does and why:

// config: { presence: { key: currentUserId } } — tells Supabase to use the user's ID as their presence key. This is what makes the Object.keys(state) trick work — the keys of the presence state are exactly the online user IDs.
// channel.track({ user_id: currentUserId }) — this is what broadcasts "I'm online" to everyone else. It only runs after SUBSCRIBED to avoid a race condition.
// Object.keys(state) — each key is one online user ID, already deduplicated by Supabase even across multiple tabs.
// return () => supabase.removeChannel(channel) — cleanup when the component unmounts, so we don't leave ghost presence entries or leak subscriptions.
// return null — this component has no UI, it just manages the side effect.
