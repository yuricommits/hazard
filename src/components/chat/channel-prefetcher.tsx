"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useMessageStore } from "@/stores/message-store";
import { useProfileCache } from "@/stores/profile-cache-store";

type Channel = { id: string; name: string };

const supabase = createClient();

export default function ChannelPrefetcher({
  channels,
}: {
  channels: Channel[];
}) {
  const { seedChannel } = useMessageStore();
  const { seedProfiles } = useProfileCache();

  useEffect(() => {
    if (!channels.length) return;

    async function prefetchChannel(channelId: string) {
      // Skip if already cached
      if (useMessageStore.getState().loaded[channelId]) return;

      const { data: messages } = await supabase
        .from("messages")
        .select(
          `
          id, content, created_at, user_id, channel_id,
          thread_id, parent_message_id, is_ai,
          profiles(id, username, display_name, avatar_url)
        `,
        )
        .eq("channel_id", channelId)
        .is("thread_id", null)
        .order("created_at", { ascending: true })
        .limit(50);

      if (!messages?.length) return;

      // Seed profile cache from fetched messages
      const profiles = messages
        .map((m) => m.profiles)
        .flat()
        .filter(
          (p): p is NonNullable<typeof p> =>
            p !== null && typeof p === "object" && "id" in p,
        );
      if (profiles.length)
        seedProfiles(profiles as Parameters<typeof seedProfiles>[0]);

      // Seed message cache
      seedChannel(
        channelId,
        messages.map((m) => ({
          ...m,
          profiles: Array.isArray(m.profiles)
            ? (m.profiles[0] ?? null)
            : m.profiles,
          reactions: [],
          replyCount: 0,
        })),
      );
    }

    // Stagger fetches slightly so we don't hammer Supabase with parallel requests
    channels.forEach((channel, index) => {
      setTimeout(() => prefetchChannel(channel.id), index * 80);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
