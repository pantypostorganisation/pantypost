// src/components/admin/messages/EmojiPicker.tsx
'use client';

import { useRef, useEffect, useState } from 'react';
import { storageService } from '@/services';

// All emojis in a single flat array
const ALL_EMOJIS = [
  // Smileys and people
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕',
  // Animals and nature
  '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🦆', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🪱', '🐛', '🦋', '🐌', '🐞', '🐜', '🪰', '🪲', '🪳', '🦟', '🦗', '🕷', '🕸', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🦣', '🐘', '🦛', '🦏', '🐪', '🐫', '🦒', '🦘', '🦬', '🐃',
  // Food and drink
  '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶', '🫑', '🥕', '🧄', '🧅', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟', '🍕', '🫓', '🥪', '🥙', '🧆', '🌮', '🌯', '🫔', '🥗', '🥘', '🫕', '🥫', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🦪', '🍤', '🍙', '🍚',
  // Activities and sports
  '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛼', '🛷', '⛸', '🥌', '🎿', '⛷', '🏂', '🪂', '🏋️', '🤼', '🤸', '⛹️', '🤺', '🤾', '🏌️', '🏇', '🧘', '🏄', '🏊', '🤽', '🚣', '🧗', '🚵', '🚴', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖', '🏵', '🎗', '🎫', '🎟', '🎪', '🤹', '🎭', '🩰', '🎨', '🎬', '🎤',
  // Travel and places
  '🚗', '🚕', '🚙', '🚌', '🚎', '🏎', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🦯', '🦽', '🦼', '🛴', '🚲', '🛵', '🏍', '🛺', '🚨', '🚔', '🚍', '🚘', '🚖', '🚡', '🚠', '🚟', '🚃', '🚋', '🚞', '🚝', '🚄', '🚅', '🚈', '🚂', '🚆', '🚇', '🚊', '🚉', '✈️', '🛫', '🛬', '🛩', '💺', '🛰', '🚀', '🛸', '🚁', '🛶', '⛵', '🚤', '🛥', '🛳', '⛴', '🚢', '⚓', '🪝', '⛽', '🚧', '🚦', '🚥', '🚏', '🗺', '🗿',
  // Objects 
  '⌚', '📱', '📲', '💻', '⌨️', '🖥', '🖨', '🖱', '🖲', '🕹', '🗜', '💽', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📽', '🎞', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙', '🎚', '🎛', '🧭', '⏱', '⏲', '⏰', '🕰', '⌛', '⏳', '📡', '🔋', '🔌', '💡', '🔦', '🕯', '🪔', '🧯', '🛢', '💸', '💵', '💴', '💶', '💷', '🪙', '💰', '💳', '💎', '⚖️', '🪜', '🧰', '🪛', '🔧', '🔨', '⚒', '🛠',
  // Symbols
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓', '🆔', '⚛️', '🉑', '☢️', '☣️', '📴', '📳', '🈶', '🈚', '🈸', '🈺', '🈷️', '✴️', '🆚', '💮', '🉐', '㊙️', '㊗️', '🈴', '🈵', '🈹', '🈲', '🅰️', '🅱️', '🆎', '🆑',
  // Flags
  '🏁', '🚩', '🎌', '🏴', '🏳️', '🏳️‍🌈', '🏳️‍⚧️', '🏴‍☠️'
];

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  onClose: () => void;
}

export default function EmojiPicker({ onEmojiSelect, onClose }: EmojiPickerProps) {
  const [recentEmojis, setRecentEmojis] = useState<string[]>([]);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Load recent emojis
  useEffect(() => {
    const loadRecentEmojis = async () => {
      try {
        const stored = await storageService.getItem<string[]>('panty_recent_emojis', []);
        if (Array.isArray(stored)) {
          setRecentEmojis(stored.slice(0, 30));
        }
      } catch (error) {
        console.error('Failed to load recent emojis:', error);
      }
    };
    
    loadRecentEmojis();
  }, []);

  // Save recent emojis
  useEffect(() => {
    if (recentEmojis.length === 0) return;
    
    const saveRecentEmojis = async () => {
      try {
        await storageService.setItem('panty_recent_emojis', recentEmojis);
      } catch (error) {
        console.error('Failed to save recent emojis:', error);
      }
    };
    
    saveRecentEmojis();
  }, [recentEmojis]);

  // Handle clicks outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const handleEmojiClick = (emoji: string) => {
    onEmojiSelect(emoji);
    
    setRecentEmojis(prev => {
      const filtered = prev.filter(e => e !== emoji);
      return [emoji, ...filtered].slice(0, 30);
    });
  };

  return (
    <div 
      ref={emojiPickerRef}
      className="absolute left-0 right-0 mx-4 bottom-full mb-2 bg-black border border-gray-800 shadow-lg z-50 rounded-lg overflow-hidden"
    >
      {/* Recent Emojis Section */}
      {recentEmojis.length > 0 && (
        <div className="px-3 pt-3">
          <div className="text-xs text-gray-400 mb-2">Recent</div>
          <div className="grid grid-cols-8 gap-1 mb-3">
            {recentEmojis.slice(0, 16).map((emoji, index) => (
              <span
                key={`recent-${emoji}-${index}`}
                onClick={() => handleEmojiClick(emoji)}
                className="emoji-button flex items-center justify-center text-xl rounded-full w-10 h-10 cursor-pointer bg-black hover:bg-[#222] transition-colors duration-150 relative z-[1]"
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
              key={`emoji-${emoji}-${index}`}
              onClick={() => handleEmojiClick(emoji)}
              className="emoji-button flex items-center justify-center text-xl rounded-full w-10 h-10 cursor-pointer bg-black hover:bg-[#222] transition-colors duration-150 relative z-[1]"
            >
              {emoji}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
