"use client";

import { useState, useRef, useEffect } from "react";
import EmojiPicker, { EmojiClickData, Theme } from "emoji-picker-react";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

type Reaction = {
  id: string;
  emoji: string;
  user_id: string;
};

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

  const hasReactions = Object.keys(grouped).length > 0;

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

  if (!hasReactions && !showPicker) {
    return (
      <div className="relative">
        <div className="h-0 overflow-hidden group-hover:h-6 transition-all duration-150">
          <button
            onClick={() => setShowPicker(true)}
            className="mt-0.5 px-2 py-0.5 rounded-full text-xs border border-zinc-800 text-zinc-600 hover:text-zinc-300 hover:border-zinc-600 transition-colors"
          >
            +
          </button>
        </div>
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

  return (
    <div className="relative">
      <div className="flex items-center gap-1 flex-wrap mt-1">
        {Object.entries(grouped).map(([emoji, { count, hasReacted }]) => (
          <button
            key={emoji}
            onClick={() => handleReaction(emoji)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-colors ${
              hasReacted
                ? "bg-zinc-800 border-zinc-600 text-zinc-200"
                : "bg-transparent border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
            }`}
          >
            <span>{emoji}</span>
            <span className="text-[10px]">{count}</span>
          </button>
        ))}
        <button
          onClick={() => setShowPicker((prev) => !prev)}
          className="max-w-0 group-hover:max-w-8 overflow-hidden opacity-0 group-hover:opacity-100 transition-all duration-200 rounded-full text-xs border border-transparent group-hover:border-zinc-800 text-zinc-600 hover:text-zinc-300 hover:border-zinc-600 whitespace-nowrap px-2 py-0.5"
        >
          +
        </button>
      </div>

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
