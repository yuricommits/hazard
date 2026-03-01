"use client";

import { useAiPanelStore } from "@/stores/ai-panel-store";

export default function AiPanelButton() {
  const { isOpen, openPanel, closePanel } = useAiPanelStore();

  function handleClick() {
    if (isOpen) {
      closePanel();
    } else {
      // Open with no channel context — channel page will update this
      openPanel("", "");
    }
  }

  return (
    <button
      onClick={handleClick}
      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${
        isOpen
          ? "bg-violet-500/10 text-violet-400 border border-violet-500/20"
          : "text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800"
      }`}
    >
      <div className="w-4 h-4 rounded-full flex items-center justify-center bg-linear-to-br from-violet-500 to-cyan-400 shrink-0">
        <svg
          width="8"
          height="8"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      </div>
      Hazard AI
    </button>
  );
}
