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
    <div className="bg-[#090a0d] border-t border-[#1a1b21] px-5 py-3 shadow-[0_-12px_32px_rgba(0,0,0,0.45)]">
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

        <div className="flex w-full items-center gap-2 rounded-full border border-[#2b2d33] bg-[#14161b]/95 px-4 py-1.5 transition-all duration-200 shadow-[0_6px_18px_rgba(0,0,0,0.35)] focus-within:border-[#4752e2] focus-within:ring-2 focus-within:ring-[#4752e2]/40 focus-within:ring-offset-2 focus-within:ring-offset-[#090a0d]">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isImageLoading}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[#3a3d45] bg-[#1d1f25] text-gray-300 transition-colors duration-200 hover:border-[#525661] hover:bg-[#262931] hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#090a0d] focus:ring-[#4752e2] disabled:cursor-not-allowed disabled:opacity-60"
              title="Attach image"
              aria-label="Attach image"
            >
              <ImageIcon size={16} />
            </button>

            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={`flex h-8 w-8 items-center justify-center rounded-full border border-transparent text-gray-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#090a0d] ${
                showEmojiPicker
                  ? 'bg-[#ff950e] text-black focus:ring-[#ff950e]'
                  : 'hover:text-white hover:bg-[#262931] focus:ring-[#4752e2]'
              }`}
              title="Add emoji"
              aria-label="Add emoji"
            >
              <Smile size={16} />
            </button>

            <button
              onClick={onCustomRequest}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-transparent text-gray-300 transition-colors duration-200 hover:text-white hover:bg-[#262931] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#090a0d] focus:ring-[#4752e2]"
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
            className="flex-1 !bg-transparent !text-white !border-0 !shadow-none !px-0 !py-0 text-[14px] placeholder:text-gray-500 resize-none focus:!outline-none focus:!ring-0 min-h-[30px] max-h-[110px] leading-[1.55]"
            style={{ height: 'auto', overflowY: replyMessage.split('\n').length > 3 ? 'auto' : 'hidden' }}
            sanitizer={messageSanitizer}
            maxLength={1000}
            characterCount={false}
            aria-label="Message"
          />

          <button
            onClick={handleReply}
            disabled={!replyMessage.trim() && !selectedImage}
            className={`flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#090a0d] ${
              !replyMessage.trim() && !selectedImage
                ? 'bg-[#262931] text-gray-500 cursor-not-allowed focus:ring-[#262931]'
                : 'bg-gradient-to-r from-[#ff9c27] to-[#f97316] text-black shadow-[0_6px_18px_rgba(249,115,22,0.35)] hover:from-[#ff8b1c] hover:to-[#f97316] focus:ring-[#f97316]'
            }`}
            aria-label="Send message"
          >
            <Send size={16} />
          </button>
        </div>

        {replyMessage.length > 0 && (
          <div className="text-xs text-gray-500 text-right pr-1 tracking-tight">{replyMessage.length}/1000</div>
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
