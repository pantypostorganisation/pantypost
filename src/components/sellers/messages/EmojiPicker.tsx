// src/components/sellers/messages/EmojiPicker.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { X, Clock, Search } from 'lucide-react';
import { motion } from 'framer-motion';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  onClose: () => void;
  anchorRef?: React.RefObject<HTMLElement | HTMLButtonElement | null>;
}

const EMOJI_CATEGORIES = {
  recent: [],
  smileys: ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕'],
  gestures: ['👋', '🤚', '🖐', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '👊', '✊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏'],
  hearts: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟'],
  objects: ['🎈', '🎉', '🎊', '🎁', '🎀', '🏆', '🏅', '🥇', '🥈', '🥉', '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛼', '🛷', '⛸', '🥌', '🎿', '⛷', '🏂'],
  food: ['🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔', '🍠', '🥐', '🥖', '🍞', '🥨', '🥯', '🧇', '🧈', '🥞', '🍳', '🥘', '🍲', '🫕', '🥣', '🥗', '🍿', '🧂', '🥫', '🍕', '🍔', '🍟', '🌭', '🥪', '🌮', '🌯', '🫔', '🥙', '🧆', '🍖', '🍗', '🥩', '🍛', '🍜', '🍝'],
  activities: ['🎭', '🎨', '🎬', '🎤', '🎧', '🎼', '🎵', '🎶', '🎹', '🥁', '🪘', '🎷', '🎺', '🪗', '🎸', '🪕', '🎻', '🎲', '♟', '🎯', '🎳', '🎮', '🎰', '🧩'],
  travel: ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🏍', '🛵', '🚲', '🛴', '🚁', '✈️', '🛫', '🛬', '🛩', '🚀', '🛸', '🚤', '⛵', '🛥', '🚢', '⛴'],
  symbols: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓', '🆔', '⚛️']
};

const EmojiPicker: React.FC<EmojiPickerProps> = ({ onEmojiSelect, onClose, anchorRef }) => {
  const [selectedCategory, setSelectedCategory] = useState<keyof typeof EMOJI_CATEGORIES>('smileys');
  const [searchTerm, setSearchTerm] = useState('');
  const [recentEmojis, setRecentEmojis] = useState<string[]>([]);
  const pickerRef = useRef<HTMLDivElement>(null);
  
  // Load recent emojis from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('recentEmojis');
    if (stored) {
      setRecentEmojis(JSON.parse(stored));
    }
  }, []);
  
  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current && 
        !pickerRef.current.contains(event.target as Node) &&
        anchorRef?.current &&
        !anchorRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose, anchorRef]);
  
  const handleEmojiClick = (emoji: string) => {
    onEmojiSelect(emoji);
    
    // Update recent emojis
    const newRecent = [emoji, ...recentEmojis.filter(e => e !== emoji)].slice(0, 20);
    setRecentEmojis(newRecent);
    localStorage.setItem('recentEmojis', JSON.stringify(newRecent));
  };
  
  const getDisplayEmojis = () => {
    if (selectedCategory === 'recent') {
      return recentEmojis;
    }
    
    const emojis = EMOJI_CATEGORIES[selectedCategory];
    
    if (searchTerm) {
      // Simple search - in production, you'd want emoji names/keywords
      return emojis.filter(emoji => emoji.includes(searchTerm));
    }
    
    return emojis;
  };
  
  const categoryIcons: Record<keyof typeof EMOJI_CATEGORIES, string> = {
    recent: '🕐',
    smileys: '😀',
    gestures: '👋',
    hearts: '❤️',
    objects: '🎉',
    food: '🍕',
    activities: '⚽',
    travel: '✈️',
    symbols: '💟'
  };
  
  return (
    <motion.div
      ref={pickerRef}
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 10 }}
      className="bg-[#2a2a2a] border border-gray-700 rounded-2xl shadow-xl w-80 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-700">
        <h3 className="text-white font-semibold">Emoji</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-700 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>
      </div>
      
      {/* Search */}
      <div className="p-3 border-b border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search emoji..."
            className="w-full pl-9 pr-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
        </div>
      </div>
      
      {/* Categories */}
      <div className="flex items-center gap-1 p-2 border-b border-gray-700 overflow-x-auto">
        {Object.entries(categoryIcons).map(([category, icon]) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category as keyof typeof EMOJI_CATEGORIES)}
            className={`
              p-2 rounded-lg transition-colors flex-shrink-0
              ${selectedCategory === category 
                ? 'bg-purple-500/20 text-purple-400' 
                : 'hover:bg-gray-700 text-gray-400'
              }
            `}
            title={category.charAt(0).toUpperCase() + category.slice(1)}
          >
            <span className="text-xl">{icon}</span>
          </button>
        ))}
      </div>
      
      {/* Emoji Grid */}
      <div className="h-64 overflow-y-auto p-2">
        <div className="grid grid-cols-8 gap-1">
          {getDisplayEmojis().map((emoji, index) => (
            <button
              key={`${emoji}-${index}`}
              onClick={() => handleEmojiClick(emoji)}
              className="p-2 hover:bg-gray-700 rounded transition-colors text-2xl"
            >
              {emoji}
            </button>
          ))}
        </div>
        
        {getDisplayEmojis().length === 0 && (
          <div className="text-center text-gray-500 py-8">
            {selectedCategory === 'recent' ? 'No recent emojis' : 'No emojis found'}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default EmojiPicker;