"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSidebarStore } from "@/stores/sidebar-store";
import CreateChannelButton from "@/components/sidebar/create-channel-button";
import AiPanelButton from "@/components/sidebar/ai-panel-button";
import WorkspacePresence from "@/components/sidebar/workspace-presence";
import SettingsOverlay from "@/components/workspace/settings-overlay";

type Channel = {
  id: string;
  name: string;
};

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
  const { collapsed, toggle } = useSidebarStore();
  const params = useParams();
  const activeChannel = params.channel as string;
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsSection, setSettingsSection] = useState<
    "profile" | "workspace"
  >("profile");

  function openSettings(section: "profile" | "workspace") {
    setSettingsSection(section);
    setSettingsOpen(true);
  }

  return (
    <>
      <motion.aside
        animate={{ width: collapsed ? 48 : 220 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="bg-black border-r border-zinc-800 flex flex-col shrink-0 overflow-hidden relative"
      >
        <WorkspacePresence
          workspaceId={workspaceId}
          currentUserId={currentUserId}
        />

        {/* Header */}
        <div className="h-12 flex items-center justify-between px-3 border-b border-zinc-800 shrink-0">
          {collapsed ? (
            <button
              onClick={toggle}
              className="mx-auto w-7 h-7 flex items-center justify-center text-[11px] font-semibold text-zinc-500 hover:text-zinc-200 transition-colors"
            >
              {workspaceName[0]?.toUpperCase()}
            </button>
          ) : (
            <>
              <AnimatePresence>
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="text-sm font-medium text-zinc-100 truncate"
                >
                  {workspaceName}
                </motion.span>
              </AnimatePresence>
              <motion.button
                onClick={toggle}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-6 h-6 flex items-center justify-center text-zinc-600 hover:text-zinc-300 transition-colors shrink-0"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </motion.button>
            </>
          )}
        </div>

        {/* Channel list */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence>
            {!collapsed && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="px-3 pt-3 pb-1 text-[10px] font-medium text-zinc-700 uppercase tracking-widest"
              >
                Channels
              </motion.p>
            )}
          </AnimatePresence>

          {channels.map((channel) => {
            const isActive = activeChannel === channel.name;
            return (
              <Link
                key={channel.id}
                href={`/${workspaceSlug}/${channel.name}`}
                title={collapsed ? `#${channel.name}` : undefined}
                className={`relative flex items-center gap-2 px-3 py-2 text-sm transition-colors border-b border-zinc-800/40 ${
                  isActive
                    ? "bg-zinc-900/60 text-zinc-100"
                    : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900/30"
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="active-channel"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-full bg-white"
                  />
                )}

                {collapsed ? (
                  <span className="text-[10px] font-medium text-zinc-500 mx-auto">
                    {channel.name[0].toUpperCase()}
                  </span>
                ) : (
                  <>
                    <span
                      className={`shrink-0 text-sm ${isActive ? "text-zinc-400" : "text-zinc-700"}`}
                    >
                      #
                    </span>
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.1 }}
                      className="truncate"
                    >
                      {channel.name}
                    </motion.span>
                  </>
                )}
              </Link>
            );
          })}

          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <CreateChannelButton
                  workspaceId={workspaceId}
                  workspaceSlug={workspaceSlug}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-zinc-800 shrink-0">
          <div className="border-b border-zinc-800/60">
            <AiPanelButton collapsed={collapsed} />
          </div>

          <button
            onClick={() => openSettings("workspace")}
            title="Settings"
            className={`w-full flex items-center gap-2 px-3 py-2.5 text-zinc-600 hover:text-zinc-300 hover:bg-zinc-900/30 transition-colors border-b border-zinc-800/60 ${
              collapsed ? "justify-center" : ""
            }`}
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
              className="shrink-0"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.1 }}
                  className="text-xs truncate"
                >
                  Settings
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          {/* User row */}
          <button
            onClick={() => openSettings("profile")}
            title="Profile"
            className={`w-full flex items-center gap-2 px-3 py-2.5 hover:bg-zinc-900/30 transition-colors ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <div className="relative shrink-0">
              <div className="w-6 h-6 border border-zinc-700 flex items-center justify-center text-[11px] font-medium text-zinc-300">
                {(displayName || username)?.[0]?.toUpperCase() ?? "?"}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border-2 border-black" />
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.1 }}
                  className="flex-1 flex flex-col items-start min-w-0"
                >
                  <span className="text-xs text-zinc-300 truncate w-full text-left font-medium">
                    {displayName || username}
                  </span>
                  {displayName && (
                    <span className="text-[10px] text-zinc-600 truncate w-full text-left">
                      @{username}
                    </span>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.aside>

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
