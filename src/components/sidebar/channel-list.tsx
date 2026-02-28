"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

type Channel = {
  id: string;
  name: string;
};

export default function ChannelList({
  channels,
  workspaceSlug,
}: {
  channels: Channel[];
  workspaceSlug: string;
}) {
  const params = useParams();
  const activeChannel = params.channel as string;

  return (
    <div>
      {channels.map((channel) => (
        <Link
          key={channel.id}
          href={`/${workspaceSlug}/${channel.name}`}
          className={`flex items-center gap-1.5 px-2 py-1 rounded text-sm transition-colors ${
            activeChannel === channel.name
              ? "bg-zinc-800 text-zinc-50"
              : "text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800/50"
          }`}
        >
          <span
            className={
              activeChannel === channel.name ? "text-zinc-400" : "text-zinc-600"
            }
          >
            #
          </span>
          {channel.name}
        </Link>
      ))}
    </div>
  );
}

// What this does:

// useParams() — reads the current URL params to know which channel is active
// Active channel gets bg-zinc-800 text-zinc-50 — slightly brighter background and white text
// Inactive channels stay muted until hovered
// This has to be a client component because useParams only works in the browser
