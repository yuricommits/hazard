"use client";

import MessageContent from "@/components/chat/message-content";

type AiMessageProps = {
  content: string;
  isStreaming?: boolean;
};

export default function AiMessage({
  content,
  isStreaming = false,
}: AiMessageProps) {
  return (
    <div className="flex items-start gap-3 px-2 py-1 rounded-lg hover:bg-zinc-900/50 group relative">
      {/* Left accent bar */}
      <div className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-linear-to-b from-violet-500 to-cyan-400" />

      {/* AI Avatar */}
      <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center bg-linear-to-br from-violet-500 to-cyan-400 ml-2">
        <svg
          width="14"
          height="14"
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

      <div className="flex flex-col min-w-0 flex-1">
        {/* Header */}
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium bg-linear-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
            Hazard AI
          </span>
          <span className="text-[10px] text-zinc-600">
            {new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>

        {/* Message content */}
        <div className="relative">
          <MessageContent content={content} />
          {/* Streaming cursor */}
          {isStreaming && (
            <span className="inline-block w-0.5 h-3.5 bg-violet-400 ml-0.5 align-middle animate-pulse" />
          )}
        </div>
      </div>
    </div>
  );
}
