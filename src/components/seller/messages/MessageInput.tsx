// src/components/seller/messages/MessageInput.tsx
'use client';

import React, { forwardRef, useState, useCallback } from 'react';
import { AlertTriangle, X, Smile, ShieldAlert, ArrowUp, Plus } from 'lucide-react';
import { SecureTextarea } from '@/components/ui/SecureInput';
import { securityService } from '@/services/security.service';
import { sanitizeStrict } from '@/utils/security/sanitization';
import { SecureImage } from '@/components/ui/SecureMessageDisplay';

interface MessageInputProps {
  replyMessage: string;
  setReplyMessage: (message: string) => void;
  selectedImage: string | null;
  setSelectedImage: (image: string | null) => void;
  imageError: string | null;
  isImageLoading: boolean;
  showEmojiPicker: boolean;
  setShowEmojiPicker: (show: boolean) => void;
  isUserBlocked: boolean;
  onReply: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onImageClick: () => void;
  onBlockToggle: () => void;
  fileInputRef: React.MutableRefObject<HTMLInputElement | null>;
  emojiPickerRef: React.MutableRefObject<HTMLDivElement | null>;
  onImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const MessageInput = forwardRef<HTMLTextAreaElement, MessageInputProps>(
  (
    {
      replyMessage,
      setReplyMessage,
      selectedImage,
      setSelectedImage,
      imageError,
      isImageLoading,
      showEmojiPicker,
      setShowEmojiPicker,
      isUserBlocked,
      onReply,
      onKeyDown,
      onImageClick,
      onBlockToggle,
      fileInputRef,
      emojiPickerRef,
      onImageSelect,
    },
    ref
  ) => {
    const canSend = (!!replyMessage.trim() || !!selectedImage) && !isImageLoading;

    const [validationError, setValidationError] = useState<string | null>(null);

    // Secure image selection with validation
    const handleSecureImageSelect = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file before processing
        const validation = securityService.validateFileUpload(file, {
          maxSize: 5 * 1024 * 1024, // 5MB
          allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
          allowedExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        });

        if (!validation.valid) {
          setValidationError(validation.error || 'Invalid file');
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          return;
        }

        // Clear validation error and proceed
        setValidationError(null);
        onImageSelect(e);
      },
      [onImageSelect, fileInputRef]
    );

    if (isUserBlocked) {
      return (
        <div className="p-4 border-t border-gray-800 text-center text-sm text-red-400 bg-[#1a1a1a] flex items-center justify-center">
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
      <div className="relative border-t border-gray-800 bg-[#1a1a1a]">
        {/* Selected image preview */}
        {selectedImage && (
          <div className="px-4 pt-3 pb-2">
            <div className="relative inline-block">
              <SecureImage
                src={selectedImage}
                alt="Preview"
                className="max-h-20 rounded shadow-md"
                onError={() => {
                  setValidationError('Failed to load image');
                  setSelectedImage(null);
                }}
              />
              <button
                onClick={() => {
                  setSelectedImage(null);
                  setValidationError(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 text-xs shadow-md transform transition-transform hover:scale-110"
                style={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                aria-label="Remove image"
                title="Remove image"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Image loading state */}
        {isImageLoading && (
          <div className="px-4 pt-3 pb-0 text-sm text-gray-400">Loading image...</div>
        )}

        {/* Error display */}
        {(imageError || validationError) && (
          <div className="px-4 pt-3 pb-0 text-sm text-red-400 flex items-center">
            <AlertTriangle size={14} className="mr-1" />
            {sanitizeStrict(imageError || validationError || '')}
          </div>
        )}

        {/* Message input with security */}
        <div className="px-4 py-3">
          <div className="relative mb-2">
            <SecureTextarea
              ref={ref}
              value={replyMessage}
              onChange={setReplyMessage}
              onKeyDown={onKeyDown}
              placeholder={selectedImage ? 'Add a caption...' : 'Type a message'}
              className="w-full py-3 pr-24 pl-14 rounded-lg bg-[#222] border border-gray-700 text-white focus:outline-none focus:ring-1 focus:ring-[#ff950e] min-h-[40px] max-h-20 resize-none overflow-auto leading-tight"
              rows={1}
              maxLength={250}
              characterCount={false}
              sanitize={true}
            />

            <input
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleSecureImageSelect}
            />

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (isImageLoading) return;
                onImageClick();
              }}
              className="absolute left-3 top-1/2 h-9 w-9 -translate-y-1/2 rounded-full border border-gray-600 bg-[#2b2b2b] text-gray-300 transition-colors duration-150 hover:bg-[#333] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e] disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Attach image"
              title="Attach Image"
              disabled={isImageLoading}
            >
              <Plus size={18} />
            </button>

            <div className="absolute right-3 top-1/2 -translate-y-1/2 mt-[-4px] flex items-center gap-2">
              {/* Emoji button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowEmojiPicker(!showEmojiPicker);
                }}
                className={`flex items-center justify-center h-8 w-8 rounded-full ${
                  showEmojiPicker ? 'bg-[#ff950e] text-black' : 'text-[#ff950e] hover:bg-[#333]'
                } transition-colors duration-150`}
                title="Emoji"
                type="button"
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
                  onReply();
                }}
                className={`flex items-center justify-center px-3.5 py-1.5 rounded-2xl transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#222] ${
                  canSend
                    ? 'bg-[#ff950e] text-black hover:bg-[#e88800] focus:ring-[#ff950e]'
                    : 'bg-[#2b2b2b] text-gray-500 cursor-not-allowed focus:ring-[#2b2b2b]'
                }`}
                aria-label="Send message"
                disabled={!canSend}
              >
                <ArrowUp size={16} strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* Character count */}
          {replyMessage.length > 0 && (
            <div className="text-xs text-gray-400 mb-2 text-right">{replyMessage.length}/250</div>
          )}
        </div>
      </div>
    );
  }
);

MessageInput.displayName = 'MessageInput';

export default MessageInput;
