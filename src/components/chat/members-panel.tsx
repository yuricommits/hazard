"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useMembersPanelStore } from "@/stores/members-panel-store";
import { usePresenceStore } from "@/stores/presence-store";
import { Users, X } from "lucide-react";

const supabase = createClient();

type Member = {
  userId: string;
  username: string;
  displayName: string | null;
  role: "owner" | "admin" | "member";
};
const ROLE_ORDER = { owner: 0, admin: 1, member: 2 };

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
      animate={{ width: isOpen ? 220 : 0, opacity: isOpen ? 1 : 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="border-l border-zinc-800 flex flex-col shrink-0 overflow-hidden bg-black"
    >
      {isOpen && (
        <>
          <div className="h-12 border-b border-zinc-800 flex items-center justify-between px-4 shrink-0">
            <div className="flex items-center gap-2">
              <Users size={13} strokeWidth={1.5} className="text-zinc-600" />
              <span className="text-sm font-medium text-zinc-200">Members</span>
              <span className="text-[11px] text-zinc-600">
                {members.length}
              </span>
            </div>
            <button
              onClick={closeMembers}
              className="w-7 h-7 flex items-center justify-center text-zinc-600 hover:text-zinc-300 hover:bg-zinc-900/40 border border-transparent hover:border-zinc-800 transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          {onlineCount > 0 && (
            <div className="px-4 py-2 border-b border-zinc-800/50 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[11px] text-zinc-600">
                {onlineCount} online
              </span>
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            {members.length === 0 ? (
              <p className="text-xs text-zinc-700 text-center mt-8">
                Loading...
              </p>
            ) : (
              members.map((m) => {
                const isOnline = onlineUserIds.has(m.userId);
                return (
                  <div
                    key={m.userId}
                    className="flex items-center gap-2.5 px-4 py-2.5 border-b border-zinc-800/40 hover:bg-zinc-900/20 transition-colors"
                  >
                    <div className="relative shrink-0">
                      <div className="w-6 h-6 border border-zinc-800 flex items-center justify-center text-[10px] font-medium text-zinc-400">
                        {(m.displayName ?? m.username)[0].toUpperCase()}
                      </div>
                      {isOnline && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500 border border-black" />
                      )}
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-xs text-zinc-300 truncate">
                        {m.displayName ?? m.username}
                      </span>
                      {m.displayName && (
                        <span className="text-[10px] text-zinc-600 truncate">
                          @{m.username}
                        </span>
                      )}
                    </div>
                    {m.role !== "member" && (
                      <span className="text-[10px] text-zinc-600 border border-zinc-800 px-1.5 py-px shrink-0">
                        {m.role}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </motion.aside>
  );
}
