"use client";

import { useEffect, useRef, useState } from "react";
import { useAiPanelStore } from "@/stores/ai-panel-store";
import { createClient } from "@/lib/supabase/client";
import MessageContent from "@/components/chat/message-content";
import { motion, AnimatePresence } from "framer-motion";
import { X, Hash, ArrowUp, Paperclip, RotateCcw } from "lucide-react";

const supabase = createClient();
const MIN_WIDTH = 260;
const MAX_WIDTH = 520;
const DEFAULT_WIDTH = 320;

type Message = { id: string; role: "user" | "assistant"; content: string };

const suggestions = [
  "Explain this codebase",
  "Review recent changes",
  "Debug an issue",
  "Write a test",
];

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
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(DEFAULT_WIDTH);
  const handleMouseMove = useRef<(e: MouseEvent) => void>(() => {});
  const handleMouseUp = useRef<(e: MouseEvent) => void>(() => {});

  useEffect(() => {
    async function loadHistory() {
      const { data } = await supabase
        .from("ai_conversations")
        .select("id, role, content")
        .eq("user_id", currentUserId)
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: true });
      if (data?.length) setMessages(data as Message[]);
    }
    loadHistory();
  }, [currentUserId, workspaceId]);

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
      setPanelWidth(
        Math.min(
          MAX_WIDTH,
          Math.max(
            MIN_WIDTH,
            dragStartWidth.current + (dragStartX.current - ev.clientX),
          ),
        ),
      );
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
        return `${profile?.display_name ?? profile?.username ?? "Unknown"}: ${m.content}`;
      })
      .join("\n");
  }

  async function sendMessage(content?: string) {
    const userContent = (content ?? input).trim();
    if (!userContent || isStreaming) return;
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
    const response = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [...messages, userMessage].map((m) => ({
          role: m.role,
          content: m.content,
        })),
        channelContext,
      }),
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
      fullContent += decoder.decode(value, { stream: true });
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
          className="border-l border-zinc-800 flex flex-col shrink-0 overflow-hidden relative bg-black"
        >
          <div
            onMouseDown={onDragHandleMouseDown}
            className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize z-10 group"
          >
            <div
              className={`absolute left-0 top-0 bottom-0 w-px transition-colors duration-150 ${isDragging ? "bg-zinc-600" : "bg-transparent group-hover:bg-zinc-700"}`}
            />
          </div>

          {/* Header */}
          <div className="h-12 border-b border-zinc-800 flex items-center justify-between px-3 shrink-0">
            <button
              onClick={closePanel}
              className="w-8 h-8 flex items-center justify-center text-zinc-600 hover:text-zinc-300 hover:bg-zinc-900/40 border border-transparent hover:border-zinc-800 transition-colors"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="7" height="18" rx="1" />
                <path d="M14 9l3 3-3 3" />
              </svg>
            </button>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="flex items-center gap-1.5 h-7 px-2.5 text-xs text-zinc-500 hover:text-zinc-200 border border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900/40 transition-all"
                >
                  <RotateCcw size={11} />
                  New Chat
                </button>
              )}
              {!messages.length && (
                <button
                  onClick={closePanel}
                  className="w-8 h-8 flex items-center justify-center text-zinc-600 hover:text-zinc-300 hover:bg-zinc-900/40 border border-transparent hover:border-zinc-800 transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Context pill */}
          {channelName && (
            <div className="px-4 py-2 border-b border-zinc-800/60">
              {useContext ? (
                <div className="flex items-center gap-1.5 w-fit border border-zinc-800 px-2.5 py-1 hover:border-zinc-700 transition-colors">
                  <Hash size={10} className="text-zinc-600" />
                  <span className="text-[11px] text-zinc-500">
                    {channelName}
                  </span>
                  <button
                    onClick={() => setUseContext(false)}
                    className="text-zinc-700 hover:text-zinc-400 transition-colors ml-0.5"
                  >
                    <X size={10} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setUseContext(true)}
                  className="flex items-center gap-1.5 text-[11px] text-zinc-700 hover:text-zinc-500 transition-colors"
                >
                  <Hash size={10} />
                  Add #{channelName} context
                </button>
              )}
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-5">
            {messages.length === 0 && !isStreaming && (
              <div className="flex flex-col gap-6 pt-2">
                <div>
                  <p className="text-xl font-semibold text-white tracking-tight">
                    Hello there!
                  </p>
                  <p className="text-sm text-zinc-500 mt-1">
                    How can I help you today?
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => sendMessage(s)}
                      className="text-left text-xs text-zinc-500 hover:text-zinc-200 border border-zinc-800 hover:border-zinc-600 px-3 py-3 transition-all leading-relaxed"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m) => (
              <div key={m.id}>
                {m.role === "user" ? (
                  <div className="flex justify-end">
                    <div className="border border-zinc-800 px-3.5 py-2.5 max-w-[85%]">
                      <p className="text-sm text-zinc-100 leading-relaxed">
                        {m.content}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-zinc-200 leading-relaxed">
                    <MessageContent content={m.content} />
                  </div>
                )}
              </div>
            ))}

            {isStreaming && (
              <div className="text-sm text-zinc-200 leading-relaxed">
                {streamingContent ? (
                  <div className="relative">
                    <MessageContent content={streamingContent} />
                    <span className="inline-block w-0.5 h-3.5 bg-zinc-400 ml-0.5 align-middle animate-pulse" />
                  </div>
                ) : (
                  <div className="flex items-center gap-1 py-1">
                    <span className="w-1.5 h-1.5 bg-zinc-600 animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 bg-zinc-600 animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 bg-zinc-600 animate-bounce [animation-delay:300ms]" />
                  </div>
                )}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-zinc-800 shrink-0">
            <div className="px-4 py-3">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                onKeyDown={handleKeyDown}
                placeholder="Send a message..."
                rows={1}
                disabled={isStreaming}
                className="w-full bg-transparent text-sm text-zinc-100 placeholder:text-zinc-700 resize-none outline-none max-h-32 overflow-y-auto disabled:opacity-50"
              />
            </div>
            <div className="flex items-center justify-between px-4 py-2 border-t border-zinc-800">
              <div className="flex items-center gap-2">
                <button className="text-zinc-700 hover:text-zinc-500 transition-colors">
                  <Paperclip size={13} />
                </button>
                <span className="text-[11px] text-zinc-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-linear-to-br from-violet-500 to-cyan-400 inline-block" />
                  Hazard AI
                </span>
              </div>
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || isStreaming}
                className="w-7 h-7 flex items-center justify-center border border-zinc-700 hover:border-zinc-500 bg-white hover:bg-zinc-100 disabled:bg-transparent disabled:border-zinc-800 disabled:text-zinc-700 text-black transition-colors"
              >
                <ArrowUp size={14} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
