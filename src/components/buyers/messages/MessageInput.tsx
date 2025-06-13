// src/components/buyers/messages/MessageInput.tsx
'use client';

import React from 'react';
import { 
  Send, 
  Image as ImageIcon, 
  Smile, 
  X, 
  Package 
} from 'lucide-react';
import EmojiPicker from './EmojiPicker';
import { MAX_IMAGE_SIZE, ALLOWED_IMAGE_TYPES } from '@/constants/emojis';

interface MessageInputProps {
  replyMessage: string;
  setReplyMessage: (message: string) => void;
  selectedImage: string | null;
  setSelectedImage: (image: string | null) => void;
  isImageLoading: boolean;
  imageError: string | null;
  showEmojiPicker: boolean;
  setShowEmojiPicker: (show: boolean) => void;
  recentEmojis: string[];
  handleReply: () => void;
  handleImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleEmojiClick: (emoji: string) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  emojiPickerRef: React.RefObject<HTMLDivElement | null>;
  isBlocked: boolean;
  onCustomRequest: () => void;
}

export default function MessageInput({
  replyMessage,
  setReplyMessage,
  selectedImage,
  setSelectedImage,
  isImageLoading,
  imageError,
  showEmojiPicker,
  setShowEmojiPicker,
  recentEmojis,
  handleReply,
  handleImageSelect,
  handleEmojiClick,
  fileInputRef,
  emojiPickerRef,
  isBlocked,
  onCustomRequest
}: MessageInputProps) {
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleReply();
    }
  };

  if (isBlocked) {
    return (
      <div className="bg-[#1a1a1a] border-t border-gray-800 p-4">
        <div className="text-center text-gray-400 text-sm">
          You have blocked this seller. Unblock to send messages.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1a1a1a] border-t border-gray-800 p-4">
      {/* Selected image preview */}
      {selectedImage && (
        <div className="mb-3 relative inline-block">
          <img 
            src={selectedImage} 
            alt="Selected" 
            className="max-h-20 rounded-lg shadow-md"
          />
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      )}
      
      {/* Image error */}
      {imageError && (
        <div className="mb-2 text-red-400 text-sm">{imageError}</div>
      )}
      
      {/* Main input area */}
      <div className="flex items-end gap-2">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
        />
        
        {/* Action buttons */}
        <div className="flex gap-1">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImageLoading}
            className="p-2 text-gray-400 hover:text-white hover:bg-[#222] rounded-lg transition-colors disabled:opacity-50"
            title="Attach image"
          >
            <ImageIcon size={20} />
          </button>
          
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 text-gray-400 hover:text-white hover:bg-[#222] rounded-lg transition-colors relative"
            title="Add emoji"
          >
            <Smile size={20} />
          </button>
          
          <button
            onClick={onCustomRequest}
            className="p-2 text-gray-400 hover:text-white hover:bg-[#222] rounded-lg transition-colors"
            title="Send custom request"
          >
            <Package size={20} />
          </button>
        </div>
        
        {/* Message input */}
        <textarea
          value={replyMessage}
          onChange={(e) => setReplyMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          rows={1}
          className="flex-1 bg-[#222] text-white rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-[#ff950e] min-h-[40px] max-h-[120px]"
          style={{
            height: 'auto',
            overflowY: replyMessage.split('\n').length > 3 ? 'auto' : 'hidden'
          }}
        />
        
        {/* Send button */}
        <button
          onClick={handleReply}
          disabled={!replyMessage.trim() && !selectedImage}
          className="p-2 bg-[#ff950e] text-black rounded-lg hover:bg-[#e88800] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send size={20} />
        </button>
      </div>
      
      {/* Emoji picker */}
      {showEmojiPicker && (
        <div ref={emojiPickerRef} className="absolute bottom-full mb-2 right-4">
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            recentEmojis={recentEmojis}
            onClose={() => setShowEmojiPicker(false)}
          />
        </div>
      )}
    </div>
  );
}
