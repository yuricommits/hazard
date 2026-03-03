"use client";

import { useEffect, useRef, useState } from "react";
import EmojiPicker, { EmojiClickData, Theme } from "emoji-picker-react";
import { CornerUpLeft, MessageSquare, SmilePlus } from "lucide-react";

type Props = {
  x: number;
  y: number;
  onCloseAction: () => void;
  onReplyAction: () => void;
  onThreadAction: () => void;
  onReactAction: (emoji: string) => void;
  hasThread: boolean;
};

const QUICK_EMOJIS = ["👍", "🙌", "🔥", "❤️", "😂", "👀"];

export default function MessageContextMenu({
  x,
  y,
  onCloseAction,
  onReplyAction,
  onThreadAction,
  onReactAction,
  hasThread,
}: Props) {
  const [showPicker, setShowPicker] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Adjust position so menu doesn't overflow viewport
  const adjustedX = Math.min(x, window.innerWidth - 280);
  const adjustedY = Math.min(y, window.innerHeight - 300);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onCloseAction();
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCloseAction();
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [onCloseAction]);

  function handleReact(emoji: string) {
    onReactAction(emoji);
    onCloseAction();
  }

  function handleEmojiPick(data: EmojiClickData) {
    onReactAction(data.emoji);
    onCloseAction();
  }

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-black border border-zinc-800 shadow-2xl w-64"
      style={{ left: adjustedX, top: adjustedY }}
    >
      {/* Quick reactions */}
      <div className="flex items-center gap-1 px-3 py-2.5 border-b border-zinc-800">
        {QUICK_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => handleReact(emoji)}
            className="w-8 h-8 flex items-center justify-center text-base hover:bg-zinc-900 border border-transparent hover:border-zinc-700 transition-colors"
          >
            {emoji}
          </button>
        ))}
        <button
          onClick={() => setShowPicker((p) => !p)}
          className="w-8 h-8 flex items-center justify-center text-zinc-600 hover:text-zinc-300 hover:bg-zinc-900 border border-transparent hover:border-zinc-700 transition-colors ml-auto"
        >
          <SmilePlus size={13} />
        </button>
      </div>

      {/* Actions */}
      <div className="flex flex-col py-1">
        <button
          onClick={() => {
            onReplyAction();
            onCloseAction();
          }}
          className="flex items-center gap-2.5 px-3 py-2 text-sm text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/40 transition-colors text-left"
        >
          <CornerUpLeft
            size={13}
            strokeWidth={1.75}
            className="text-zinc-600"
          />
          Reply
        </button>
        {!hasThread && (
          <button
            onClick={() => {
              onThreadAction();
              onCloseAction();
            }}
            className="flex items-center gap-2.5 px-3 py-2 text-sm text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/40 transition-colors text-left"
          >
            <MessageSquare
              size={13}
              strokeWidth={1.75}
              className="text-zinc-600"
            />
            Create thread
          </button>
        )}
      </div>

      {/* Full emoji picker */}
      {showPicker && (
        <div className="border-t border-zinc-800">
          <EmojiPicker
            theme={Theme.DARK}
            onEmojiClick={handleEmojiPick}
            height={320}
            width={256}
          />
        </div>
      )}
    </div>
  );
}
