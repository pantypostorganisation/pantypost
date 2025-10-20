// src/components/buyers/messages/MessageInput.tsx

'use client';

import React from 'react';
import { AlertTriangle, X, Smile, ArrowUp, Plus, ShieldAlert } from 'lucide-react';
import EmojiPicker from './EmojiPicker';
import { SecureTextarea } from '@/components/ui/SecureInput';
import { SecureImage } from '@/components/ui/SecureMessageDisplay';
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
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleReply();
    }
  };

  const canSend = (!!replyMessage.trim() || !!selectedImage) && !isImageLoading;

  const messageSanitizer = (value: string): string =>
    value.replace(/<[^>]*>/g, '').replace(/[^\w\s\n\r.,!?'"()-]/g, '').slice(0, 250);

  if (isBlocked) {
    return (
      <div className="p-4 border-t border-gray-800 text-center text-sm text-red-400 bg-[#1a1a1a] flex items-center justify-center">
        <ShieldAlert size={16} className="mr-2" />
        You have blocked this seller. Unblock to send messages.
      </div>
    );
  }

  return (
    <div className="relative border-t border-gray-800 bg-[#1a1a1a]">
      {selectedImage && (
        <div className="px-4 pt-3 pb-2">
          <div className="relative inline-block">
            <SecureImage src={selectedImage} alt="Selected" className="max-h-20 rounded shadow-md" />
            <button
              onClick={() => {
                setSelectedImage(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 text-xs shadow-md transform transition-transform hover:scale-110"
              style={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              aria-label="Remove attached image"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {isImageLoading && <div className="px-4 pt-3 pb-0 text-sm text-gray-400">Loading image...</div>}

      {imageError && (
        <div className="px-4 pt-3 pb-0 text-sm text-red-400 flex items-center">
          <AlertTriangle size={14} className="mr-1" />
          {sanitizeStrict(imageError)}
        </div>
      )}

      <div className="px-4 pt-2.5">
        <div className="flex w-full items-center gap-2 rounded-full border border-[#2f2f2f] bg-[#1a1a1a] px-3 py-1.5 focus-within:ring-1 focus-within:ring-[#ff950e]">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleImageSelect}
            className="hidden"
          />

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (isImageLoading) return;
              fileInputRef.current?.click();
            }}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#3a3a3a] bg-[#232323] text-gray-300 transition-colors duration-150 hover:bg-[#2d2d2d] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e] disabled:cursor-not-allowed disabled:opacity-50"
            title="Attach image"
            aria-label="Attach image"
            disabled={isImageLoading}
          >
            <Plus size={18} />
          </button>

          <SecureTextarea
            value={replyMessage}
            onChange={setReplyMessage}
            onKeyDown={handleKeyDown}
            placeholder={selectedImage ? 'Add a caption...' : 'Type a message'}
            rows={1}
            className="flex-1 bg-transparent py-1.5 text-white focus:outline-none focus:ring-0 min-h-[32px] max-h-20 resize-none overflow-auto leading-tight"
            sanitizer={messageSanitizer}
            maxLength={250}
            characterCount={false}
            aria-label="Message"
          />

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowEmojiPicker(!showEmojiPicker);
              }}
              className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors duration-150 ${
                showEmojiPicker ? 'bg-[#ff950e] text-black' : 'text-[#ff950e] hover:bg-[#2d2d2d]'
              }`}
              title="Emoji"
              aria-label="Toggle emoji picker"
              aria-pressed={showEmojiPicker}
            >
              <Smile size={20} className="flex-shrink-0" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (!canSend) return;
                setShowEmojiPicker(false);
                handleReply();
              }}
              disabled={!canSend}
              className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#1a1a1a] ${
                canSend
                  ? 'bg-[#ff950e] text-black hover:bg-[#e88800] focus:ring-[#ff950e]'
                  : 'bg-[#2b2b2b] text-gray-500 cursor-not-allowed focus:ring-[#2b2b2b]'
              }`}
              aria-label="Send message"
            >
              <ArrowUp size={16} strokeWidth={2.5} />
            </button>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-3 text-sm text-gray-300">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onCustomRequest();
            }}
            className="flex items-center gap-2 rounded-full border border-[#2f2f2f] bg-[#1f1f1f] px-4 py-1.5 text-gray-200 transition-colors duration-150 hover:bg-[#2a2a2a] focus:outline-none focus:ring-2 focus:ring-[#ff950e]"
            title="Send custom request"
            aria-label="Send custom request"
          >
            <img src="/Custom_Request_Icon.png" alt="Custom request" className="h-4 w-4" />
            <span>Custom Request</span>
          </button>
        </div>
      </div>

      {showEmojiPicker && (
        <div
          ref={emojiPickerRef}
          className="absolute left-0 right-0 mx-4 bottom-full mb-2 bg-black border border-gray-800 shadow-lg z-50 rounded-lg"
        >
          <EmojiPicker onEmojiClick={handleEmojiClick} recentEmojis={recentEmojis} onClose={() => setShowEmojiPicker(false)} />
        </div>
      )}
    </div>
  );
}
