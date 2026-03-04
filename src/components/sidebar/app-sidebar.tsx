"use client";

import { useState, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import LogoNode from "@/components/sidebar/logo-node";
import CreateChannelButton from "@/components/sidebar/create-channel-button";
import AiPanelButton from "@/components/sidebar/ai-panel-button";
import WorkspacePresence from "@/components/sidebar/workspace-presence";
import SettingsOverlay from "@/components/workspace/settings-overlay";
import { useMessageStore } from "@/stores/message-store";
import { useUnreadStore } from "@/stores/unread-store";

type Channel = { id: string; name: string };

export default function AppSidebar({
  workspaceName,
  workspaceSlug,
  workspaceId,
  currentUserId,
  username,
  displayName,
  channels,
}: {
  workspaceName: string;
  workspaceSlug: string;
  workspaceId: string;
  currentUserId: string;
  username: string;
  displayName: string | null;
  channels: Channel[];
}) {
  const params = useParams();
  const router = useRouter();
  const activeChannel = params.channel as string;
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsSection, setSettingsSection] = useState<
    "profile" | "workspace"
  >("profile");
  const [isPending, startTransition] = useTransition();
  const [pendingChannel, setPendingChannel] = useState<string | null>(null);

  const { getHasUnread, markRead } = useUnreadStore();

  function openSettings(section: "profile" | "workspace") {
    setSettingsSection(section);
    setSettingsOpen(true);
  }

  function handleChannelClick(e: React.MouseEvent, channel: Channel) {
    e.preventDefault();
    if (channel.name === activeChannel) return;
    markRead(channel.id);
    setPendingChannel(channel.name);
    startTransition(() => {
      router.push(`/${workspaceSlug}/${channel.name}`);
      setPendingChannel(null);
    });
  }

  function handleChannelHover(channelName: string) {
    router.prefetch(`/${workspaceSlug}/${channelName}`);
  }

  return (
    <>
      <aside className="w-12 bg-black border-r border-zinc-800 flex flex-col shrink-0 overflow-hidden">
        <WorkspacePresence
          workspaceId={workspaceId}
          currentUserId={currentUserId}
        />

        {/* Logo */}
        <LogoNode />

        {/* Channel list */}
        <div className="flex-1 overflow-y-auto flex flex-col">
          {channels.map((channel) => {
            const isActive = activeChannel === channel.name;
            const isLoading = isPending && pendingChannel === channel.name;

            // Get last message timestamp from cache for unread comparison
            const cachedMessages = useMessageStore.getState().cache[channel.id];
            const confirmedMessages = cachedMessages?.filter(
              (m) => !m.isPending && !m.isFailed && !m.is_ai,
            );
            const lastMessageAt = confirmedMessages?.length
              ? confirmedMessages[confirmedMessages.length - 1].created_at
              : null;

            const hasUnread =
              !isActive && getHasUnread(channel.id, lastMessageAt);

            return (
              <a
                key={channel.id}
                href={`/${workspaceSlug}/${channel.name}`}
                title={`#${channel.name}`}
                onClick={(e) => handleChannelClick(e, channel)}
                onMouseEnter={() => handleChannelHover(channel.name)}
                className={`relative w-full h-10 flex items-center justify-center text-[11px] font-medium border-b border-zinc-800/40 transition-colors select-none cursor-pointer ${
                  isActive
                    ? "bg-zinc-900/60 text-zinc-100"
                    : isLoading
                      ? "bg-zinc-900/40 text-zinc-300"
                      : hasUnread
                        ? "text-zinc-200 hover:text-zinc-100 hover:bg-zinc-900/30"
                        : "text-zinc-600 hover:text-zinc-300 hover:bg-zinc-900/30"
                }`}
              >
                {/* Active indicator */}
                {isActive && (
                  <span className="absolute left-0 top-0 bottom-0 w-px bg-white" />
                )}
                {/* Loading indicator */}
                {isLoading && !isActive && (
                  <span className="absolute left-0 top-0 bottom-0 w-px bg-zinc-600 animate-pulse" />
                )}
                {/* Unread indicator — violet left bar */}
                {hasUnread && !isLoading && (
                  <span className="absolute left-0 top-0 bottom-0 w-px bg-violet-500" />
                )}

                {channel.name[0].toUpperCase()}

                {/* Unread dot — bottom right */}
                {hasUnread && (
                  <span className="absolute bottom-2 right-2 w-1 h-1 rounded-full bg-violet-500" />
                )}
              </a>
            );
          })}
          <CreateChannelButton
            workspaceId={workspaceId}
            workspaceSlug={workspaceSlug}
            iconOnly
          />
        </div>

        {/* Bottom */}
        <div className="border-t border-zinc-800 flex flex-col">
          <div className="border-b border-zinc-800/60">
            <AiPanelButton />
          </div>

          <button
            onClick={() => openSettings("workspace")}
            title="Settings"
            className="w-full h-10 flex items-center justify-center text-zinc-600 hover:text-zinc-300 hover:bg-zinc-900/30 transition-colors border-b border-zinc-800/60"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>

          <button
            onClick={() => openSettings("profile")}
            title={displayName ?? username}
            className="w-full h-10 flex items-center justify-center hover:bg-zinc-900/30 transition-colors"
          >
            <div className="relative">
              <div className="w-6 h-6 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-[10px] font-medium text-zinc-300">
                {(displayName || username)?.[0]?.toUpperCase() ?? "?"}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500 border border-black" />
            </div>
          </button>
        </div>
      </aside>

      <SettingsOverlay
        open={settingsOpen}
        initialSection={settingsSection}
        onCloseAction={() => setSettingsOpen(false)}
        workspaceId={workspaceId}
        workspaceName={workspaceName}
        workspaceSlug={workspaceSlug}
        currentUserId={currentUserId}
        username={username}
        displayName={displayName}
      />
    </>
  );
}
