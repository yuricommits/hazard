"use client";

import { useMembersPanelStore } from "@/stores/members-panel-store";
import { Users } from "lucide-react";

export default function MembersPanelButton() {
  const { toggleMembers, isOpen } = useMembersPanelStore();

  return (
    <button
      onClick={toggleMembers}
      title="Members"
      className={`w-full h-full flex items-center justify-center transition-colors ${
        isOpen
          ? "text-zinc-200 bg-zinc-900/40"
          : "text-zinc-600 hover:text-zinc-300 hover:bg-zinc-900/30"
      }`}
    >
      <Users size={13} strokeWidth={1.75} />
    </button>
  );
}
