"use client";

import { useState, useRef, useEffect } from "react";
import EmojiPicker, { EmojiClickData, Theme } from "emoji-picker-react";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

type Reaction = { id: string; emoji: string; user_id: string };

export default function ReactionButton({
  messageId,
  reactions: initialReactions,
  currentUserId,
}: {
  messageId: string;
  reactions: Reaction[];
  currentUserId: string;
}) {
  const [reactions, setReactions] = useState<Reaction[]>(initialReactions);
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setReactions(initialReactions);
  }, [initialReactions]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const grouped = reactions.reduce(
    (acc: Record<string, { count: number; hasReacted: boolean }>, r) => {
      if (!acc[r.emoji]) acc[r.emoji] = { count: 0, hasReacted: false };
      acc[r.emoji].count++;
      if (r.user_id === currentUserId) acc[r.emoji].hasReacted = true;
      return acc;
    },
    {},
  );

  async function handleReaction(emoji: string) {
    const existing = reactions.find(
      (r) => r.emoji === emoji && r.user_id === currentUserId,
    );
    if (existing) {
      setReactions((prev) => prev.filter((r) => r.id !== existing.id));
      await supabase.from("reactions").delete().eq("id", existing.id);
    } else {
      const temp: Reaction = {
        id: crypto.randomUUID(),
        emoji,
        user_id: currentUserId,
      };
      setReactions((prev) => [...prev, temp]);
      await supabase
        .from("reactions")
        .insert({ message_id: messageId, user_id: currentUserId, emoji });
    }
  }

  async function handleEmojiClick(emojiData: EmojiClickData) {
    setShowPicker(false);
    await handleReaction(emojiData.emoji);
  }

  return (
    <div className="relative flex items-center gap-1 flex-wrap mt-1">
      {Object.entries(grouped).map(([emoji, { count, hasReacted }]) => (
        <button
          key={emoji}
          onClick={() => handleReaction(emoji)}
          className={`flex items-center gap-1 px-2 py-0.5 text-xs border transition-colors ${
            hasReacted
              ? "border-zinc-600 text-zinc-200 bg-zinc-900/40"
              : "border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
          }`}
        >
          <span>{emoji}</span>
          <span className="text-[10px]">{count}</span>
        </button>
      ))}

      {/* Always-visible add button */}
      <button
        onClick={() => setShowPicker((prev) => !prev)}
        className="flex items-center justify-center w-6 h-5 text-zinc-700 hover:text-zinc-400 border border-zinc-800/60 hover:border-zinc-700 transition-colors text-xs"
      >
        +
      </button>

      {showPicker && (
        <div ref={pickerRef} className="absolute bottom-8 left-0 z-50">
          <EmojiPicker
            theme={Theme.DARK}
            onEmojiClick={handleEmojiClick}
            height={350}
            width={300}
          />
        </div>
      )}
    </div>
  );
}
