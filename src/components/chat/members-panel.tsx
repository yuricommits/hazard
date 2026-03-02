"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useMembersPanelStore } from "@/stores/members-panel-store";
import { usePresenceStore } from "@/stores/presence-store";

const supabase = createClient();

type Member = {
  userId: string;
  username: string;
  displayName: string | null;
  role: "owner" | "admin" | "member";
};

const ROLE_ORDER = { owner: 0, admin: 1, member: 2 };

const ROLE_BADGE: Record<string, string> = {
  owner: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  admin: "text-violet-400 bg-violet-500/10 border-violet-500/20",
  member: "text-zinc-500 bg-zinc-800 border-zinc-700",
};

export default function MembersPanel({ workspaceId }: { workspaceId: string }) {
  const { isOpen, closeMembers } = useMembersPanelStore();
  const [members, setMembers] = useState<Member[]>([]);
  const onlineUserIds = usePresenceStore((s) => s.onlineUserIds);

  useEffect(() => {
    if (!isOpen) return;

    async function fetchMembers() {
      const { data } = await supabase
        .from("workspace_members")
        .select("user_id, role, profiles(username, display_name)")
        .eq("workspace_id", workspaceId);

      if (!data) return;

      const result: Member[] = data
        .map((m) => {
          const profile = Array.isArray(m.profiles)
            ? m.profiles[0]
            : m.profiles;
          return {
            userId: m.user_id,
            username: profile?.username ?? "unknown",
            displayName: profile?.display_name ?? null,
            role: m.role as Member["role"],
          };
        })
        .sort((a, b) => ROLE_ORDER[a.role] - ROLE_ORDER[b.role]);

      setMembers(result);
    }

    fetchMembers();
  }, [isOpen, workspaceId]);

  const onlineCount = members.filter((m) => onlineUserIds.has(m.userId)).length;

  return (
    <motion.aside
      animate={{ width: isOpen ? 240 : 0, opacity: isOpen ? 1 : 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="border-l border-zinc-800 flex flex-col shrink-0 overflow-hidden"
    >
      {isOpen && (
        <>
          {/* Header */}
          <div className="h-12 border-b border-zinc-800 flex items-center justify-between px-4 shrink-0">
            <div className="flex items-center gap-2">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-zinc-500"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span className="text-sm font-semibold text-zinc-50">
                Members
              </span>
              <span className="text-[11px] text-zinc-600">
                {members.length}
              </span>
            </div>
            <button
              onClick={closeMembers}
              className="text-zinc-500 hover:text-zinc-300 transition-colors text-lg leading-none"
            >
              ×
            </button>
          </div>

          {/* Online count */}
          {onlineCount > 0 && (
            <div className="px-4 py-2 border-b border-zinc-800/50">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[11px] text-zinc-500">
                  {onlineCount} online
                </span>
              </div>
            </div>
          )}

          {/* Members list */}
          <div className="flex-1 overflow-y-auto p-2">
            {members.length === 0 ? (
              <p className="text-xs text-zinc-600 text-center mt-8">
                Loading members...
              </p>
            ) : (
              <div className="flex flex-col gap-0.5">
                {members.map((m) => {
                  const isOnline = onlineUserIds.has(m.userId);
                  const initials = (m.displayName ??
                    m.username)[0].toUpperCase();

                  return (
                    <div
                      key={m.userId}
                      className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-zinc-900/50 transition-colors"
                    >
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-medium text-zinc-400">
                          {initials}
                        </div>
                        {isOnline && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border-2 border-zinc-950" />
                        )}
                      </div>

                      {/* Name */}
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-xs font-medium text-zinc-200 truncate">
                          {m.displayName ?? m.username}
                        </span>
                        {m.displayName && (
                          <span className="text-[10px] text-zinc-600 truncate">
                            @{m.username}
                          </span>
                        )}
                      </div>

                      {/* Role badge */}
                      {m.role !== "member" && (
                        <span
                          className={`text-[10px] px-1.5 py-px rounded-full border font-medium shrink-0 ${ROLE_BADGE[m.role]}`}
                        >
                          {m.role}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </motion.aside>
  );
}
