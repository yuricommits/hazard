"use client";

import MessageContent from "@/components/chat/message-content";

export default function AiMessage({ content }: { content: string }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3 border-b border-zinc-800/20 relative">
      {/* Left violet glow bar */}
      <div className="absolute left-0 top-0 bottom-0 w-px bg-violet-500/60 shadow-[0_0_8px_2px_rgba(139,92,246,0.4)]" />

      {/* Diamond mark */}
      <div className="shrink-0 w-8 h-8 flex items-center justify-center mt-0.5 relative">
        <div className="w-2.5 h-2.5 bg-white rotate-45 shadow-[0_0_10px_3px_rgba(255,255,255,0.5),0_0_20px_6px_rgba(139,92,246,0.3)]" />
      </div>

      <div className="flex flex-col min-w-0 flex-1">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-sm font-medium text-violet-300 tracking-wide">
            Hazard AI
          </span>
        </div>
        <div className="text-sm text-zinc-300 leading-relaxed">
          <MessageContent content={content} />
        </div>
      </div>
    </div>
  );
}
