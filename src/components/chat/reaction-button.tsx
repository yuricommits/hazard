"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  reactions,
  currentUserId,
}: {
  messageId: string;
  reactions: Reaction[];
  currentUserId: string;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const grouped = reactions.reduce<
    Record<string, { count: number; hasReacted: boolean }>
  >((acc, r) => {
    if (!acc[r.emoji]) {
      acc[r.emoji] = { count: 0, hasReacted: false };
    }
    acc[r.emoji].count++;
    if (r.user_id === currentUserId) {
      acc[r.emoji].hasReacted = true;
    }
    return acc;
  }, {});

  async function handleReaction(emoji: string) {
    const existing = reactions.find(
      (r) => r.emoji === emoji && r.user_id === currentUserId,
    );

    if (existing) {
      await supabase.from("reactions").delete().eq("id", existing.id);
    } else {
      await supabase.from("reactions").insert({
        message_id: messageId,
        user_id: currentUserId,
        emoji,
      });
    }

    router.refresh();
  }

  async function handleEmojiClick(emojiData: EmojiClickData) {
    setShowPicker(false);
    await handleReaction(emojiData.emoji);
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-1 flex-wrap mt-1">
        {Object.entries(grouped).map(([emoji, { count, hasReacted }]) => (
          <button
            key={emoji}
            onClick={() => handleReaction(emoji)}
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs border transition-colors ${
              hasReacted
                ? "bg-violet-500/20 border-violet-500/40 text-violet-300"
                : "bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-zinc-600"
            }`}
          >
            <span>{emoji}</span>
            <span>{count}</span>
          </button>
        ))}
        <button
          onClick={() => setShowPicker((prev) => !prev)}
          className="px-1.5 py-0.5 rounded-full text-xs border border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-600 transition-colors"
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

// What this does:

// Groups reactions by emoji — shows 👍 3 instead of three separate 👍
// hasReacted — if you've reacted, the button glows violet
// Clicking an existing reaction you've made removes it (toggle)
// + button opens the emoji picker
// Click outside closes the picker
// Picker sits above the message using absolute positioning
