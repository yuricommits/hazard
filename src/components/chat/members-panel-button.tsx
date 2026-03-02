"use client";

import { useMembersPanelStore } from "@/stores/members-panel-store";

export default function MembersPanelButton() {
  const { toggleMembers, isOpen } = useMembersPanelStore();

  return (
    <button
      onClick={toggleMembers}
      className={`text-xs px-2 py-1 rounded hover:bg-zinc-800 transition-colors ${
        isOpen
          ? "text-zinc-200 bg-zinc-800"
          : "text-zinc-500 hover:text-zinc-300"
      }`}
    >
      Members
    </button>
  );
}
