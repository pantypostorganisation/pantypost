// src/components/buyers/messages/MessageInput.tsx
'use client';

import React from 'react';
import { Send, Image as ImageIcon, Smile, X, Package } from 'lucide-react';
import EmojiPicker from './EmojiPicker';
import { SecureTextarea } from '@/components/ui/SecureInput';
import { sanitizeStrict } from '@/utils/security/sanitization';

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
  onCustomRequest,
}: MessageInputProps) {
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleReply();
    }
  };

  const messageSanitizer = (value: string): string =>
    value.replace(/<[^>]*>/g, '').replace(/[^\w\s\n\r.,!?'"()-]/g, '').slice(0, 1000);

  if (isBlocked) {
    return (
      <div className="bg-[#1a1a1a] border-t border-gray-800 p-4">
        <div className="text-center text-gray-400 text-sm">You have blocked this seller. Unblock to send messages.</div>
      </div>
    );
  }

  return (
    <div className="bg-[#1a1a1a] border-t border-gray-800 p-4">
      {selectedImage && (
        <div className="mb-3 relative inline-block">
          <img src={selectedImage} alt="Selected" className="max-h-20 rounded-lg shadow-md" />
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
            aria-label="Remove attached image"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {imageError && <div className="mb-2 text-red-400 text-sm">{sanitizeStrict(imageError)}</div>}

      <div className="flex items-end gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleImageSelect}
          className="hidden"
        />

        <div className="flex gap-1">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImageLoading}
            className="p-2 text-gray-400 hover:text-white hover:bg-[#222] rounded-lg transition-colors disabled:opacity-50"
            title="Attach image"
            aria-label="Attach image"
          >
            <ImageIcon size={20} />
          </button>

          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 text-gray-400 hover:text-white hover:bg-[#222] rounded-lg transition-colors relative"
            title="Add emoji"
            aria-label="Add emoji"
          >
            <Smile size={20} />
          </button>

          <button
            onClick={onCustomRequest}
            className="p-2 text-gray-400 hover:text-white hover:bg-[#222] rounded-lg transition-colors"
            title="Send custom request"
            aria-label="Send custom request"
          >
            <Package size={20} />
          </button>
        </div>

        <div className="flex-1">
          <SecureTextarea
            value={replyMessage}
            onChange={setReplyMessage}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            rows={1}
            className="w-full !bg-[#222] !text-white !border-0 rounded-lg px-3 py-2 resize-none focus:outline-none focus:!ring-2 focus:!ring-[#ff950e] min-h-[40px] max-h-[120px]"
            style={{ height: 'auto', overflowY: replyMessage.split('\n').length > 3 ? 'auto' : 'hidden' }}
            sanitizer={messageSanitizer}
            maxLength={1000}
            characterCount={false}
            aria-label="Message"
          />
        </div>

        <button
          onClick={handleReply}
          disabled={!replyMessage.trim() && !selectedImage}
          className="p-2 bg-[#ff950e] text-black rounded-lg hover:bg-[#e88800] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Send message"
        >
          <Send size={20} />
        </button>
      </div>

      {showEmojiPicker && (
        <div ref={emojiPickerRef} className="absolute bottom-full mb-2 right-4">
          <EmojiPicker onEmojiClick={handleEmojiClick} recentEmojis={recentEmojis} onClose={() => setShowEmojiPicker(false)} />
        </div>
      )}
    </div>
  );
}
