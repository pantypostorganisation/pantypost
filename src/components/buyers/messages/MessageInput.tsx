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

      <div className="px-4 py-2">
        <div className="flex w-full items-center gap-1.5 rounded-2xl border border-[#2a2d31] bg-[#1a1c20] px-3 py-1.5 focus-within:border-[#3d4352] focus-within:ring-1 focus-within:ring-[#4752e2]/40 focus-within:ring-offset-1 focus-within:ring-offset-[#16161a]">
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
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#363840] bg-[#202226] text-gray-300 transition-colors duration-150 hover:border-[#4a4c56] hover:bg-[#272a2f] hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#1f1f24] focus:ring-[#4752e2] disabled:cursor-not-allowed disabled:opacity-50"
            title="Attach image"
            aria-label="Attach image"
            disabled={isImageLoading}
          >
            <Plus size={16} />
          </button>

          <SecureTextarea
            value={replyMessage}
            onChange={setReplyMessage}
            onKeyDown={handleKeyDown}
            placeholder={selectedImage ? 'Add a caption...' : 'Type a message'}
            rows={1}
            className="flex-1 self-center !bg-transparent !border-0 !shadow-none !px-0 !py-[6px] text-[15px] text-gray-100 placeholder:text-gray-500 focus:!outline-none focus:!ring-0 min-h-[32px] max-h-20 !resize-none overflow-auto leading-[1.6]"
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
              className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#1f1f24] ${
                showEmojiPicker
                  ? 'bg-[#ff950e] text-black focus:ring-[#ff950e]'
                  : 'border border-transparent text-gray-300 hover:text-white hover:bg-[#272a2f] focus:ring-[#4752e2]'
              }`}
              title="Emoji"
              aria-label="Toggle emoji picker"
              aria-pressed={showEmojiPicker}
            >
              <Smile size={18} className="flex-shrink-0" />
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
              className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#1f1f24] ${
                canSend
                  ? 'bg-[#ff950e] text-black hover:bg-[#e88800] focus:ring-[#ff950e]'
                  : 'bg-[#2b2b2b] text-gray-500 cursor-not-allowed focus:ring-[#2b2b2b]'
              }`}
              aria-label="Send message"
            >
              <ArrowUp size={14} strokeWidth={2.5} />
            </button>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-2 text-xs text-gray-300">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onCustomRequest();
            }}
            className="flex items-center gap-1.5 rounded-full border border-[#363840] bg-[#202226] px-3 py-1 text-gray-200 transition-colors duration-150 hover:border-[#4a4c56] hover:bg-[#272a2f] hover:text-white focus:outline-none focus:ring-1 focus:ring-[#4752e2]/60 focus:ring-offset-1 focus:ring-offset-[#16161a]"
            title="Send custom request"
            aria-label="Send custom request"
          >
            <img src="/Custom_Request_Icon.png" alt="Custom request" className="h-3.5 w-3.5" />
            <span className="text-xs font-medium uppercase tracking-wide">Custom</span>
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
