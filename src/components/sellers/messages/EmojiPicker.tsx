// src/components/sellers/messages/EmojiPicker.tsx
'use client';

import React from 'react';
import { ALL_EMOJIS } from '@/constants/emojis';

interface EmojiPickerProps {
  recentEmojis: string[];
  onEmojiClick: (emoji: string) => void;
}

export default function EmojiPicker({ recentEmojis, onEmojiClick }: EmojiPickerProps) {
  return (
    <div className="absolute left-0 right-0 mx-4 bottom-full mb-2 bg-black border border-gray-800 shadow-lg z-50 rounded-lg overflow-hidden">
      {/* Recent Emojis Section */}
      {recentEmojis.length > 0 && (
        <div className="px-3 pt-3">
          <div className="text-xs text-gray-400 mb-2">Recent</div>
          <div className="grid grid-cols-8 gap-1 mb-3">
            {recentEmojis.slice(0, 16).map((emoji, index) => (
              <span
                key={`recent-${index}`}
                onClick={() => onEmojiClick(emoji)}
                className="emoji-button flex items-center justify-center text-xl rounded-full w-10 h-10 cursor-pointer bg-black hover:bg-[#222] transition-colors duration-150"
              >
                {emoji}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {/* All Emojis */}
      <div className="px-3 pt-2 pb-3">
        {recentEmojis.length > 0 && (
          <div className="text-xs text-gray-400 mb-2">All Emojis</div>
        )}
        <div className="grid grid-cols-8 gap-1 p-0 overflow-auto" style={{ maxHeight: '200px' }}>
          {ALL_EMOJIS.map((emoji, index) => (
            <span
              key={`emoji-${index}`}
              onClick={() => onEmojiClick(emoji)}
              className="emoji-button flex items-center justify-center text-xl rounded-full w-10 h-10 cursor-pointer bg-black hover:bg-[#222] transition-colors duration-150"
            >
              {emoji}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}