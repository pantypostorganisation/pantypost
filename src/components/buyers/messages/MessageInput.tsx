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

      <div className="flex flex-col gap-1.5">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleImageSelect}
          className="hidden"
        />

        <div className="flex w-full items-center gap-2 rounded-2xl border border-[#2a2d31] bg-[#1a1c20] px-3.5 py-2 focus-within:border-[#3d4352] focus-within:ring-1 focus-within:ring-[#4752e2]/40 focus-within:ring-offset-1 focus-within:ring-offset-[#1a1a1a]">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isImageLoading}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#363840] bg-[#202226] text-gray-300 transition-colors duration-150 hover:border-[#4a4c56] hover:bg-[#272a2f] hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#1a1a1a] focus:ring-[#4752e2] disabled:cursor-not-allowed disabled:opacity-60"
              title="Attach image"
              aria-label="Attach image"
            >
              <ImageIcon size={16} />
            </button>

            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-transparent text-gray-300 transition-colors duration-150 hover:text-white hover:bg-[#272a2f] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#1a1a1a] focus:ring-[#4752e2]"
              title="Add emoji"
              aria-label="Add emoji"
            >
              <Smile size={16} />
            </button>

            <button
              onClick={onCustomRequest}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-transparent text-gray-300 transition-colors duration-150 hover:text-white hover:bg-[#272a2f] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#1a1a1a] focus:ring-[#4752e2]"
              title="Send custom request"
              aria-label="Send custom request"
            >
              <Package size={16} />
            </button>
          </div>

          <SecureTextarea
            value={replyMessage}
            onChange={setReplyMessage}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 !bg-transparent !text-white !border-0 !shadow-none !px-0 !py-0.5 text-[15px] placeholder:text-gray-500 resize-none focus:!outline-none focus:!ring-0 min-h-[34px] max-h-[120px]"
            style={{ height: 'auto', overflowY: replyMessage.split('\n').length > 3 ? 'auto' : 'hidden' }}
            sanitizer={messageSanitizer}
            maxLength={1000}
            characterCount={false}
            aria-label="Message"
          />

          <button
            onClick={handleReply}
            disabled={!replyMessage.trim() && !selectedImage}
            className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#1a1a1a] ${
              !replyMessage.trim() && !selectedImage
                ? 'bg-[#2b2b2b] text-gray-500 cursor-not-allowed focus:ring-[#2b2b2b]'
                : 'bg-[#ff950e] text-black hover:bg-[#e88800] focus:ring-[#ff950e]'
            }`}
            aria-label="Send message"
          >
            <Send size={16} />
          </button>
        </div>

        {replyMessage.length > 0 && (
          <div className="text-[11px] text-gray-500 text-right pr-1">{replyMessage.length}/1000</div>
        )}
      </div>

      {showEmojiPicker && (
        <div ref={emojiPickerRef} className="absolute bottom-full mb-2 right-4">
          <EmojiPicker onEmojiClick={handleEmojiClick} recentEmojis={recentEmojis} onClose={() => setShowEmojiPicker(false)} />
        </div>
      )}
    </div>
  );
}
