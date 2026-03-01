"use client";

import { useEffect, useRef, useState } from "react";
import { useAiPanelStore } from "@/stores/ai-panel-store";
import { createClient } from "@/lib/supabase/client";
import MessageContent from "@/components/chat/message-content";
import { motion, AnimatePresence } from "framer-motion";

const supabase = createClient();

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
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

    // Add user message to state
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: userContent,
    };
    setMessages((prev) => [...prev, userMessage]);

    // Save user message to database
    await supabase.from("ai_conversations").insert({
      user_id: currentUserId,
      workspace_id: workspaceId,
      role: "user",
      content: userContent,
    });

    // Start streaming
    setIsStreaming(true);
    setStreamingContent("");

    const channelContext = await getChannelContext();

    // Build messages array for API (full history)
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

    // Stream the response token by token
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

    // Streaming done — move to messages state
    setIsStreaming(false);
    setStreamingContent("");

    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: fullContent,
    };
    setMessages((prev) => [...prev, assistantMessage]);

    // Save assistant message to database
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
          animate={{ width: 288, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="border-l border-zinc-800 flex flex-col shrink-0 overflow-hidden"
        >
          {/* Header */}
          <div className="h-12 border-b border-zinc-800 flex items-center justify-between px-4 shrink-0">
            <div className="flex items-center gap-2">
              {/* Gradient AI icon */}
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
              {/* Clear history button */}
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
            {messages.length === 0 && !isStreaming && (
              <p className="text-xs text-zinc-600 text-center mt-4">
                Ask Hazard AI anything
              </p>
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
