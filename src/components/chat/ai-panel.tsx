"use client";

import { useEffect, useRef, useState } from "react";
import { useAiPanelStore } from "@/stores/ai-panel-store";
import { createClient } from "@/lib/supabase/client";
import MessageContent from "@/components/chat/message-content";
import { motion, AnimatePresence } from "framer-motion";

const supabase = createClient();

const MIN_WIDTH = 240;
const MAX_WIDTH = 520;
const DEFAULT_WIDTH = 288;

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export default function AiPanel({
  workspaceId,
  currentUserId,
}: {
  workspaceId: string;
  currentUserId: string;
}) {
  const { isOpen, channelId, channelName, closePanel } = useAiPanelStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [useContext, setUseContext] = useState(true);
  const [streamingContent, setStreamingContent] = useState("");
  const [panelWidth, setPanelWidth] = useState(DEFAULT_WIDTH);
  const [isDragging, setIsDragging] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Drag refs — avoids circular useCallback dependency
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(DEFAULT_WIDTH);
  const handleMouseMove = useRef<(e: MouseEvent) => void>(() => {});
  const handleMouseUp = useRef<(e: MouseEvent) => void>(() => {});

  // Load conversation history from database on mount
  useEffect(() => {
    async function loadHistory() {
      const { data } = await supabase
        .from("ai_conversations")
        .select("id, role, content")
        .eq("user_id", currentUserId)
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: true });

      if (data?.length) {
        setMessages(data as Message[]);
      }
    }

    loadHistory();
  }, [currentUserId, workspaceId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  function onDragHandleMouseDown(e: React.MouseEvent) {
    e.preventDefault();
    dragStartX.current = e.clientX;
    dragStartWidth.current = panelWidth;
    setIsDragging(true);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    handleMouseMove.current = (ev: MouseEvent) => {
      const delta = dragStartX.current - ev.clientX;
      const newWidth = Math.min(
        MAX_WIDTH,
        Math.max(MIN_WIDTH, dragStartWidth.current + delta),
      );
      setPanelWidth(newWidth);
    };

    handleMouseUp.current = () => {
      setIsDragging(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", handleMouseMove.current);
      window.removeEventListener("mouseup", handleMouseUp.current);
    };

    window.addEventListener("mousemove", handleMouseMove.current);
    window.addEventListener("mouseup", handleMouseUp.current);
  }

  async function getChannelContext(): Promise<string> {
    if (!channelId || !useContext) return "";

    const { data } = await supabase
      .from("messages")
      .select("content, profiles(display_name, username)")
      .eq("channel_id", channelId)
      .is("thread_id", null)
      .eq("is_ai", false)
      .order("created_at", { ascending: false })
      .limit(10);

    if (!data?.length) return "";

    return data
      .reverse()
      .map((m) => {
        const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
        const name = profile?.display_name ?? profile?.username ?? "Unknown";
        return `${name}: ${m.content}`;
      })
      .join("\n");
  }

  async function sendMessage() {
    if (!input.trim() || isStreaming) return;

    const userContent = input.trim();
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: userContent,
    };
    setMessages((prev) => [...prev, userMessage]);

    await supabase.from("ai_conversations").insert({
      user_id: currentUserId,
      workspace_id: workspaceId,
      role: "user",
      content: userContent,
    });

    setIsStreaming(true);
    setStreamingContent("");

    const channelContext = await getChannelContext();

    const apiMessages = [...messages, userMessage].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const response = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: apiMessages, channelContext }),
    });

    if (!response.ok || !response.body) {
      setIsStreaming(false);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      fullContent += chunk;
      setStreamingContent(fullContent);
    }

    setIsStreaming(false);
    setStreamingContent("");

    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: fullContent,
    };
    setMessages((prev) => [...prev, assistantMessage]);

    await supabase.from("ai_conversations").insert({
      user_id: currentUserId,
      workspace_id: workspaceId,
      role: "assistant",
      content: fullContent,
    });
  }

  async function clearHistory() {
    await supabase
      .from("ai_conversations")
      .delete()
      .eq("user_id", currentUserId)
      .eq("workspace_id", workspaceId);

    setMessages([]);
    setStreamingContent("");
  }

  async function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      await sendMessage();
    }
  }

  const suggestions = [
    "Explain this codebase",
    "Review recent changes",
    "Debug an issue",
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: panelWidth, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={
            isDragging
              ? { duration: 0 }
              : { type: "spring", stiffness: 300, damping: 30 }
          }
          className="border-l border-zinc-800 flex flex-col shrink-0 overflow-hidden relative"
        >
          {/* Drag handle — left edge */}
          <div
            onMouseDown={onDragHandleMouseDown}
            className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize z-10 group"
          >
            <div
              className={`absolute left-0 top-0 bottom-0 w-px transition-colors duration-150 ${
                isDragging
                  ? "bg-violet-500"
                  : "bg-transparent group-hover:bg-violet-500/50"
              }`}
            />
          </div>

          {/* Header */}
          <div className="h-12 border-b border-zinc-800 flex items-center justify-between px-4 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full flex items-center justify-center bg-linear-to-br from-violet-500 to-cyan-400 shrink-0">
                <svg
                  width="10"
                  height="10"
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
              <span className="text-sm font-semibold bg-linear-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                Hazard AI
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={clearHistory}
                title="Clear history"
                className="text-[11px] text-zinc-500 hover:text-zinc-300 px-1.5 py-0.5 rounded hover:bg-zinc-800 transition-colors"
              >
                Clear
              </button>
              <button
                onClick={closePanel}
                className="text-zinc-500 hover:text-zinc-300 transition-colors text-lg leading-none"
              >
                ×
              </button>
            </div>
          </div>

          {/* Context pill */}
          {channelName && (
            <div className="px-3 py-2 border-b border-zinc-800/50">
              {useContext ? (
                <div className="flex items-center gap-1.5 w-fit bg-violet-500/10 border border-violet-500/20 rounded-full px-2 py-0.5">
                  <span className="text-[11px] text-violet-400">
                    Using #{channelName} context
                  </span>
                  <button
                    onClick={() => setUseContext(false)}
                    className="text-violet-500 hover:text-violet-300 leading-none transition-colors"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setUseContext(true)}
                  className="text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors"
                >
                  + Add #{channelName} context
                </button>
              )}
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
            {/* Empty state */}
            {messages.length === 0 && !isStreaming && (
              <div className="flex flex-col items-center gap-4 mt-6 px-2">
                <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-violet-500/15 to-cyan-400/15 border border-violet-500/20 flex items-center justify-center">
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <defs>
                      <linearGradient
                        id="aiGrad"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                      >
                        <stop offset="0%" stopColor="#8b5cf6" />
                        <stop offset="100%" stopColor="#22d3ee" />
                      </linearGradient>
                    </defs>
                    <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="url(#aiGrad)" />
                    <path d="M2 17l10 5 10-5" stroke="url(#aiGrad)" />
                    <path d="M2 12l10 5 10-5" stroke="url(#aiGrad)" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-xs font-medium text-zinc-300">
                    Your dev intelligence layer
                  </p>
                  <p className="text-[11px] text-zinc-600 mt-1 leading-relaxed">
                    Ask about code, architecture,
                    <br />
                    or what&apos;s happening in this channel.
                  </p>
                </div>
                <div className="flex flex-col gap-1.5 w-full mt-1">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => setInput(s)}
                      className="text-left text-[11px] text-zinc-500 hover:text-zinc-300 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-lg px-3 py-2 transition-all"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m) => (
              <div key={m.id} className="flex flex-col gap-1">
                {m.role === "user" ? (
                  <div className="flex justify-end">
                    <div className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 max-w-[85%]">
                      <p className="text-sm text-zinc-50">{m.content}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center bg-linear-to-br from-violet-500 to-cyan-400 mt-0.5">
                      <svg
                        width="9"
                        height="9"
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
                    <div className="flex-1 min-w-0">
                      <MessageContent content={m.content} />
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Streaming response */}
            {isStreaming && (
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center bg-linear-to-br from-violet-500 to-cyan-400 mt-0.5">
                  <svg
                    width="9"
                    height="9"
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
                <div className="flex-1 min-w-0">
                  {streamingContent ? (
                    <div className="relative">
                      <MessageContent content={streamingContent} />
                      <span className="inline-block w-0.5 h-3.5 bg-violet-400 ml-0.5 align-middle animate-pulse" />
                    </div>
                  ) : (
                    <div className="flex items-center gap-0.5 mt-1">
                      <span className="w-1 h-1 rounded-full bg-violet-500 animate-bounce [animation-delay:0ms]" />
                      <span className="w-1 h-1 rounded-full bg-violet-500 animate-bounce [animation-delay:150ms]" />
                      <span className="w-1 h-1 rounded-full bg-violet-500 animate-bounce [animation-delay:300ms]" />
                    </div>
                  )}
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-3 shrink-0">
            <div className="border border-zinc-800 rounded-lg px-3 py-2 focus-within:border-zinc-700 transition-colors">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                onKeyDown={handleKeyDown}
                placeholder="Ask Hazard AI..."
                rows={1}
                disabled={isStreaming}
                className="w-full bg-transparent text-sm text-zinc-50 placeholder:text-zinc-600 resize-none outline-none max-h-32 overflow-y-auto disabled:opacity-50"
              />
            </div>
            <p className="text-[10px] text-zinc-600 mt-1 px-1">
              Enter to send · Shift+Enter for new line
            </p>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
