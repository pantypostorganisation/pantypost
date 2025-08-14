'use client';

import { useRef, useEffect, useState } from 'react';
import { storageService } from '@/services';

// Flat emoji list (trimmed for brevity in this snippet)
const ALL_EMOJIS: string[] = [
  '😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙂','🙃','😉','😌','😍','🥰','😘','😗','😙','😚','😋','😛','😝','😜','😏','😒',
  // ... keep your full list unchanged ...
  '🏴‍☠️'
];

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  onClose: () => void;
}

export default function EmojiPicker({ onEmojiSelect, onClose }: EmojiPickerProps) {
  const [recentEmojis, setRecentEmojis] = useState<string[]>([]);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Load recent
  useEffect(() => {
    (async () => {
      try {
        const stored = await storageService.getItem<string[]>('panty_recent_emojis', []);
        if (Array.isArray(stored)) {
          setRecentEmojis(stored.slice(0, 30));
        }
      } catch (error) {
        console.error('Failed to load recent emojis:', error);
      }
    })();
  }, []);

  // Save recent
  useEffect(() => {
    if (recentEmojis.length === 0) return;
    (async () => {
      try {
        await storageService.setItem('panty_recent_emojis', recentEmojis);
      } catch (error) {
        console.error('Failed to save recent emojis:', error);
      }
    })();
  }, [recentEmojis]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleEmojiClick = (emoji: string) => {
    onEmojiSelect(emoji);
    setRecentEmojis((prev) => {
      const filtered = prev.filter((e) => e !== emoji);
      return [emoji, ...filtered].slice(0, 30);
    });
  };

  return (
    <div
      ref={emojiPickerRef}
      className="absolute left-0 right-0 mx-4 bottom-full mb-2 bg-black border border-gray-800 shadow-lg z-50 rounded-lg overflow-hidden"
      role="dialog"
      aria-label="Emoji picker"
    >
      {recentEmojis.length > 0 && (
        <div className="px-3 pt-3">
          <div className="text-xs text-gray-400 mb-2">Recent</div>
          <div className="grid grid-cols-8 gap-1 mb-3">
            {recentEmojis.slice(0, 16).map((emoji, index) => (
              <button
                key={`recent-${emoji}-${index}`}
                onClick={() => handleEmojiClick(emoji)}
                className="flex items-center justify-center text-xl rounded-full w-10 h-10 bg-black hover:bg-[#222] transition-colors duration-150"
                type="button"
                aria-label={`Insert emoji ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="px-3 pt-2 pb-3">
        {recentEmojis.length > 0 && <div className="text-xs text-gray-400 mb-2">All Emojis</div>}
        <div className="grid grid-cols-8 gap-1 p-0 overflow-auto" style={{ maxHeight: 200 }}>
          {ALL_EMOJIS.map((emoji, index) => (
            <button
              key={`emoji-${emoji}-${index}`}
              onClick={() => handleEmojiClick(emoji)}
              className="flex items-center justify-center text-xl rounded-full w-10 h-10 bg-black hover:bg-[#222] transition-colors duration-150"
              type="button"
              aria-label={`Insert emoji ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
