"use client";

import { useState, useRef, useEffect } from "react";
import EmojiPicker, { type EmojiClickData } from "emoji-picker-react";

export function EmojiPickerButton({
  onSelect,
}: {
  onSelect: (emoji: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleEmojiClick(emojiData: EmojiClickData) {
    onSelect(emojiData.emoji);
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 7c0 .55-.45 1-1 1s-1-.45-1-1 .45-1 1-1 1 .45 1 1zm6 0c0 .55-.45 1-1 1s-1-.45-1-1 .45-1 1-1 1 .45 1 1zm.28 5.28c-.39.39-1.02.39-1.41 0-2.35-2.35-6.14-2.35-8.49 0-.39.39-1.02.39-1.41 0s-.39-1.02 0-1.41c3.12-3.12 8.19-3.12 11.31 0 .39.39.39 1.02 0 1.41z" />
        </svg>
      </button>
      {open && (
        <div className="absolute bottom-full right-0 mb-2 z-50">
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            height={350}
            width={280}
          />
        </div>
      )}
    </div>
  );
}
