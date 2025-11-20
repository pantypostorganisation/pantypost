// src/components/seller/messages/MessageInputContainer.tsx
'use client';

import React, { useCallback } from 'react';
import { X, Smile, AlertTriangle, ShieldAlert, ArrowUp, Plus } from 'lucide-react';
import { SecureTextarea } from '@/components/ui/SecureInput';
import { SecureImage } from '@/components/ui/SecureMessageDisplay';
import { sanitizeStrict } from '@/utils/security/sanitization';
import { ALL_EMOJIS } from '@/constants/emojis';

interface MessageInputContainerProps {
  isUserBlocked: boolean;
  onBlockToggle: () => void;
  activeThread: string;
  replyMessage: string;
  setReplyMessage: (message: string) => void;
  selectedImage: string | null;
  setSelectedImage: (image: string | null) => void;
  isImageLoading: boolean;
  setIsImageLoading: (loading: boolean) => void;
  imageError: string | null;
  setImageError: (error: string | null) => void;
  showEmojiPicker: boolean;
  setShowEmojiPicker: (show: boolean) => void;
  recentEmojis: string[];
  handleReply: () => void;
  handleEmojiClick: (emoji: string) => void;
  handleImageSelect: (file: File) => void;
  inputRef: React.RefObject<HTMLTextAreaElement>;
  fileInputRef: React.RefObject<HTMLInputElement>;
  emojiPickerRef: React.RefObject<HTMLDivElement>;
  lastManualScrollTime: React.RefObject<number>;
}

export default function MessageInputContainer({ 
  isUserBlocked, 
  onBlockToggle,
  activeThread,
  replyMessage,
  setReplyMessage,
  selectedImage,
  setSelectedImage,
  isImageLoading,
  setIsImageLoading,
  imageError,
  setImageError,
  showEmojiPicker,
  setShowEmojiPicker,
  recentEmojis,
  handleReply,
  handleEmojiClick,
  handleImageSelect,
  inputRef,
  fileInputRef,
  emojiPickerRef,
  lastManualScrollTime
}: MessageInputContainerProps) {

  const messageSanitizer = (value: string): string => 
    value.replace(/<[^>]*>/g, '').slice(0, 250);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleReply();
    }
  }, [handleReply]);

  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, [fileInputRef]);

  const handleImageSelectFromInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Basic validation
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setImageError('Please select a valid image file');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      setImageError('Image too large. Maximum size is 5MB');
      return;
    }
    
    setImageError(null);
    handleImageSelect(file);
  }, [handleImageSelect, setImageError]);

  const canSend = (!!replyMessage.trim() || !!selectedImage) && !isImageLoading;

  if (isUserBlocked) {
    return (
      <div className="p-4 text-center text-sm text-red-400 flex items-center justify-center">
        <ShieldAlert size={16} className="mr-2" />
        You have blocked this buyer
        <button
          onClick={(e) => {
            e.stopPropagation();
            onBlockToggle();
          }}
          className="ml-2 underline text-gray-400 hover:text-white transition-colors duration-150"
        >
          Unblock
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Selected image preview */}
      {selectedImage && (
        <div className="px-4 pt-3 pb-2">
          <div className="relative inline-block">
            <SecureImage 
              src={selectedImage} 
              alt="Selected preview" 
              className="max-h-20 rounded shadow-md" 
            />
            <button
              onClick={() => {
                setSelectedImage(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
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

      {isImageLoading && (
        <div className="px-4 pt-3 pb-0 text-sm text-gray-400">Loading image...</div>
      )}

      {imageError && (
        <div className="px-4 pt-3 pb-0 text-sm text-red-400 flex items-center">
          <AlertTriangle size={14} className="mr-1" />
          {sanitizeStrict(imageError)}
        </div>
      )}

      {/* Input area */}
      <div className="px-4 py-2">
        <div className="flex w-full items-center gap-1.5 rounded-2xl border border-[#2a2d31] bg-[#1a1c20] px-3 py-1.5 focus-within:border-[#3d4352] focus-within:ring-1 focus-within:ring-[#4752e2]/40 focus-within:ring-offset-1 focus-within:ring-offset-[#16161a]">
          <input
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleImageSelectFromInput}
          />

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (isImageLoading) return;
              triggerFileInput();
            }}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#363840] bg-[#202226] text-gray-300 transition-colors duration-150 hover:border-[#4a4c56] hover:bg-[#272a2f] hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#1f1f24] focus:ring-[#4752e2] disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Attach image"
            title="Attach Image"
            disabled={isImageLoading}
          >
            <Plus size={16} />
          </button>

          <SecureTextarea
            ref={inputRef}
            value={replyMessage}
            onChange={setReplyMessage}
            onKeyPress={handleKeyDown}
            onFocus={(e) => {
              e.preventDefault();
            }}
            placeholder={selectedImage ? 'Add a caption...' : 'Type a message'}
            className="flex-1 self-center !bg-transparent !border-0 !shadow-none !px-0 !pt-[10px] !pb-[4px] text-[15px] text-gray-100 placeholder:text-gray-500 focus:!outline-none focus:!ring-0 min-h-[34px] max-h-20 !resize-none overflow-auto leading-[1.6]"
            rows={1}
            maxLength={250}
            sanitizer={messageSanitizer}
            characterCount={false}
            aria-label="Message"
          />

          <div className="flex items-center gap-1.5">
            <button
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
              type="button"
              aria-label="Toggle emoji picker"
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
              className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#1f1f24] ${
                canSend
                  ? 'bg-[#ff950e] text-black hover:bg-[#e88800] focus:ring-[#ff950e]'
                  : 'bg-[#2b2b2b] text-gray-500 cursor-not-allowed focus:ring-[#2b2b2b]'
              }`}
              aria-label="Send message"
              disabled={!canSend}
            >
              <ArrowUp size={14} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>

      {/* Inline emoji picker */}
      {showEmojiPicker && (
        <div
          ref={emojiPickerRef}
          className="absolute left-0 right-0 mx-4 bottom-full mb-2 bg-black border border-gray-800 shadow-lg z-50 rounded-lg overflow-hidden"
        >
          {/* Recent */}
          {recentEmojis.length > 0 && (
            <div className="px-3 pt-3">
              <div className="text-xs text-gray-400 mb-2">Recent</div>
              <div className="grid grid-cols-8 gap-1 mb-3">
                {recentEmojis.slice(0, 16).map((emoji: string, idx: number) => (
                  <span
                    key={`recent-${idx}`}
                    onClick={() => handleEmojiClick(emoji)}
                    className="emoji-button flex items-center justify-center text-xl rounded-full w-10 h-10 cursor-pointer bg-black hover:bg-[#222] transition-colors duration-150"
                  >
                    {emoji}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* All emojis */}
          <div className="px-3 pt-2 pb-3">
            {recentEmojis.length > 0 && <div className="text-xs text-gray-400 mb-2">All Emojis</div>}
            <div className="grid grid-cols-8 gap-1 p-0 overflow-auto" style={{ maxHeight: '200px' }}>
              {ALL_EMOJIS.map((emoji, idx) => (
                <span
                  key={`emoji-${idx}`}
                  onClick={() => handleEmojiClick(emoji)}
                  className="emoji-button flex items-center justify-center text-xl rounded-full w-10 h-10 cursor-pointer bg-black hover:bg-[#222] transition-colors duration-150"
                >
                  {emoji}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}