// src/components/buyers/messages/EmojiPicker.tsx
'use client';

import React, { useState } from 'react';
import { X, Clock } from 'lucide-react';
import { ALL_EMOJIS } from '@/constants/emojis';

interface EmojiPickerProps {
  onEmojiClick: (emoji: string) => void;
  recentEmojis: string[];
  onClose: () => void;
}

const EMOJI_CATEGORIES = {
  recent: [],
  smileys: ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕'],
  hearts: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '❣️', '💔', '❤️‍🔥', '❤️‍🩹', '💋'],
  hands: ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '👊', '✊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏'],
  people: ['👶', '👧', '🧒', '👦', '👩', '🧑', '👨', '👩‍🦱', '🧑‍🦱', '👨‍🦱', '👩‍🦰', '🧑‍🦰', '👨‍🦰', '👱‍♀️', '👱', '👱‍♂️', '👩‍🦳', '🧑‍🦳', '👨‍🦳', '👩‍🦲', '🧑‍🦲', '👨‍🦲', '🧔‍♀️', '🧔', '🧔‍♂️', '👵', '🧓', '👴', '👲', '👳‍♀️', '👳', '👳‍♂️', '🧕', '👮‍♀️', '👮', '👮‍♂️', '👷‍♀️', '👷', '👷‍♂️', '💂‍♀️', '💂', '💂‍♂️', '🕵️‍♀️', '🕵️', '🕵️‍♂️'],
  nature: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐻‍❄️', '🐨', '🐯', '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🪱', '🐛', '🦋', '🐌', '🐞', '🐜', '🪰', '🪲', '🪳', '🦟', '🦗', '🕷️', '🕸️', '🦂'],
  food: ['🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟', '🍕'],
  objects: ['⌚', '📱', '📲', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '🕹️', '🗜️', '💽', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📽️', '🎞️', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙️', '🎚️', '🎛️', '🧭', '⏱️', '⏲️', '⏰', '🕰️', '⌛', '⏳', '📡', '🔋', '🔌', '💡', '🔦', '🕯️', '🪔', '🧯', '🛢️', '💸', '💵', '💴', '💶', '💷'],
  symbols: ['❤️', '💔', '💕', '💖', '💗', '💙', '💚', '💛', '🧡', '💜', '🤎', '🖤', '🤍', '💯', '💢', '💥', '💫', '💦', '💨', '🕳️', '💬', '👁️‍🗨️', '🗨️', '🗯️', '💭', '💤', '🎈', '🎉', '🎊', '🎋', '🎍', '🎎', '🎏', '🎐', '🎑', '🧧', '🎀', '🎁', '🎗️', '🎟️', '🎫', '🎖️', '🏆', '🏅', '🥇', '🥈', '🥉', '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱'],
};

export default function EmojiPicker({ onEmojiClick, recentEmojis, onClose }: EmojiPickerProps) {
  const [activeCategory, setActiveCategory] = useState<keyof typeof EMOJI_CATEGORIES>('smileys');

  const categories = [
    { key: 'recent' as const, icon: <Clock size={16} />, label: 'Recent' },
    { key: 'smileys' as const, icon: '😀', label: 'Smileys' },
    { key: 'hearts' as const, icon: '❤️', label: 'Hearts' },
    { key: 'hands' as const, icon: '👋', label: 'Hands' },
    { key: 'people' as const, icon: '👤', label: 'People' },
    { key: 'nature' as const, icon: '🐾', label: 'Nature' },
    { key: 'food' as const, icon: '🍔', label: 'Food' },
    { key: 'objects' as const, icon: '📱', label: 'Objects' },
    { key: 'symbols' as const, icon: '❤️', label: 'Symbols' },
  ];

  const emojis = activeCategory === 'recent' ? recentEmojis : EMOJI_CATEGORIES[activeCategory];

  return (
    <div className="bg-[#222] border border-gray-700 rounded-lg shadow-lg w-[320px] max-h-[400px] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-2 border-b border-gray-700">
        <h3 className="text-sm font-medium text-white">Emoji</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-[#333] rounded transition-colors"
        >
          <X size={16} className="text-gray-400" />
        </button>
      </div>
      
      {/* Categories */}
      <div className="flex items-center gap-1 p-2 border-b border-gray-700 overflow-x-auto">
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`p-2 rounded transition-colors ${
              activeCategory === cat.key 
                ? 'bg-[#ff950e] text-black' 
                : 'hover:bg-[#333] text-gray-400'
            }`}
            title={cat.label}
          >
            {typeof cat.icon === 'string' ? <span className="text-lg">{cat.icon}</span> : cat.icon}
          </button>
        ))}
      </div>
      
      {/* Emoji Grid */}
      <div className="flex-1 overflow-y-auto p-2">
        {emojis.length === 0 && activeCategory === 'recent' ? (
          <div className="text-center text-gray-400 text-sm py-8">
            No recent emojis yet
          </div>
        ) : (
          <div className="grid grid-cols-8 gap-1">
            {emojis.map((emoji, index) => (
              <button
                key={`${emoji}-${index}`}
                onClick={() => onEmojiClick(emoji)}
                className="p-2 hover:bg-[#333] rounded transition-colors text-xl"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
