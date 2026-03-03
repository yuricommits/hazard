"use client";

import { useAiPanelStore } from "@/stores/ai-panel-store";

export default function AiPanelButton() {
  const { isOpen, openPanel, closePanel } = useAiPanelStore();

  function handleClick() {
    if (isOpen) closePanel();
    else openPanel("", "");
  }

  return (
    <button
      onClick={handleClick}
      title="Hazard AI"
      className="w-full h-10 flex items-center justify-center hover:bg-zinc-900/30 transition-colors border-b border-zinc-800/60 group"
    >
      <div className="relative flex items-center justify-center w-5 h-5">
        {/* Plasma ring — only when open */}
        {isOpen && (
          <>
            <span className="absolute w-4 h-4 rounded-full bg-violet-500/20 animate-ping" />
            <span className="absolute w-3 h-3 rounded-full border border-violet-500/40" />
          </>
        )}

        {/* Outer glow ring — hover when closed */}
        {!isOpen && (
          <span className="absolute w-3.5 h-3.5 rounded-full bg-white/0 group-hover:bg-white/5 border border-zinc-700 group-hover:border-zinc-500 transition-all duration-300" />
        )}

        {/* Core dot */}
        <span
          className={`relative w-1.5 h-1.5 rounded-full z-10 transition-all duration-300 ${
            isOpen
              ? "bg-white shadow-[0_0_8px_3px_rgba(255,255,255,0.6),0_0_16px_6px_rgba(139,92,246,0.4)]"
              : "bg-zinc-600 group-hover:bg-white group-hover:shadow-[0_0_6px_2px_rgba(255,255,255,0.4)]"
          }`}
        />
      </div>
    </button>
  );
}
