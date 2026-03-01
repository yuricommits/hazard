"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSidebarStore } from "@/stores/sidebar-store";
import CreateChannelButton from "@/components/sidebar/create-channel-button";
import SignOutButton from "@/components/sidebar/sign-out-button";
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
        animate={{ width: collapsed ? 56 : 240 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="border-r border-zinc-800 flex flex-col shrink-0 overflow-hidden relative"
      >
        <WorkspacePresence
          workspaceId={workspaceId}
          currentUserId={currentUserId}
        />

        {/* Header */}
        <div className="h-12 flex items-center justify-between px-3 border-b border-zinc-800 shrink-0">
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="text-sm font-semibold text-zinc-50 truncate"
              >
                {workspaceName}
              </motion.span>
            )}
          </AnimatePresence>
          <motion.button
            onClick={toggle}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className={`w-6 h-6 flex items-center justify-center rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors shrink-0 ${collapsed ? "mx-auto" : ""}`}
          >
            <motion.svg
              animate={{ rotate: collapsed ? 180 : 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
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
            </motion.svg>
          </motion.button>
        </div>

        {/* Channel list */}
        <div className="flex-1 overflow-y-auto py-2">
          <AnimatePresence>
            {!collapsed && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="px-3 py-1 text-[10px] font-medium text-zinc-500 uppercase tracking-widest"
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
                className={`flex items-center gap-2 mx-1 px-2 py-1.5 rounded-md text-sm transition-colors ${
                  isActive
                    ? "bg-zinc-800 text-zinc-50"
                    : "text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800/50"
                }`}
              >
                <span
                  className={`shrink-0 ${isActive ? "text-violet-400" : "text-zinc-600"}`}
                >
                  #
                </span>
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.1 }}
                      className="truncate"
                    >
                      {channel.name}
                    </motion.span>
                  )}
                </AnimatePresence>
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
        <div className="p-2 border-t border-zinc-800 shrink-0 flex flex-col gap-1">
          <AiPanelButton collapsed={collapsed} />

          {/* Settings button — opens Workspace section */}
          <button
            onClick={() => openSettings("workspace")}
            title="Workspace settings"
            className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors ${
              collapsed ? "justify-center mx-1" : "mx-1"
            }`}
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

          {/* User row — clickable, opens Profile section */}
          <button
            onClick={() => openSettings("profile")}
            title="Profile settings"
            className={`flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-zinc-800 transition-colors w-full ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <div className="relative shrink-0">
              <div className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center text-[11px] font-medium text-zinc-300">
                {(displayName || username)?.[0]?.toUpperCase() ?? "?"}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-zinc-950" />
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.1 }}
                  className="text-xs text-zinc-400 truncate flex-1 text-left"
                >
                  {displayName || username}
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          {/* Sign out — only shown when expanded */}
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.1 }}
              >
                <SignOutButton />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.aside>

      {/* Settings overlay — outside aside so it covers full screen */}
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
