// src/components/messaging/MessageInput.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Plus, Send, Smile, X } from 'lucide-react';
import { compressImage } from '@/utils/imageUtils';
import { SecureTextarea } from '@/components/ui/SecureInput';
import { securityService } from '@/services';
import { sanitizeStrict } from '@/utils/security/sanitization';

interface MessageInputProps {
  onSendMessage: (text: string, image?: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
  showAttachmentButton?: boolean;
  showEmojiButton?: boolean;
  onEmojiClick?: () => void;
  className?: string;
  autoFocus?: boolean;
}

/**
 * Reusable message input component with image attachment support and security
 */
const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  placeholder = 'Type a message',
  disabled = false,
  maxLength = 250,
  showAttachmentButton = true,
  showEmojiButton = true,
  onEmojiClick,
  className = '',
  autoFocus = false,
}) => {
  const [content, setContent] = useState<string>('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus the input when the component mounts
  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    textarea.style.height = 'auto';
    const newHeight = Math.min(textarea.scrollHeight, 200); // Max height: 200px
    textarea.style.height = `${newHeight}px`;
  }, [content]);

  const triggerFileInput = () => {
    if (disabled) return;
    setValidationError(null);
    fileInputRef.current?.click();
  };

  // Handle image selection with security validation
  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target) return;
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = securityService.validateFileUpload(file, {
      maxSize: 5 * 1024 * 1024, // 5MB
      allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
      allowedExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    });

    if (!validation.valid) {
      setValidationError(validation.error || 'Invalid file');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      setIsUploading(true);
      setValidationError(null);
      const compressedImage = await compressImage(file, 1200, 0.7);
      setSelectedImage(compressedImage);
      if (textareaRef.current) textareaRef.current.placeholder = 'Add a caption...';
    } catch (error) {
      console.error('Error processing image:', error);
      setValidationError('Error processing image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setValidationError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (textareaRef.current) textareaRef.current.placeholder = placeholder;
    textareaRef.current?.focus();
  };

  const handleSend = () => {
    if (disabled || (!content.trim() && !selectedImage) || isUploading) return;
    setValidationError(null);
    onSendMessage(content.trim(), selectedImage);
    setContent('');
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className={`px-5 py-3 border-t border-[#1a1b21] bg-[#090a0d] shadow-[0_-12px_32px_rgba(0,0,0,0.45)] ${className}`}
    >
      {isUploading && (
        <div className="mb-2 flex items-center text-sm text-[#ff950e]">
          <div className="w-4 h-4 mr-2 border-2 border-[#ff950e] border-t-transparent rounded-full animate-spin"></div>
          Optimizing image...
        </div>
      )}

      {validationError && (
        <div className="mb-2 text-sm text-red-400 flex items-center">
          <span className="mr-1">⚠️</span>
          {sanitizeStrict(validationError)}
        </div>
      )}

      {selectedImage && (
        <div className="mb-2">
          <div className="relative inline-block">
            <img
              src={selectedImage}
              alt="Preview"
              className="max-h-20 rounded shadow-md"
              onError={() => {
                setValidationError('Failed to load image');
                setSelectedImage(null);
              }}
            />
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg"
              disabled={disabled}
              aria-label="Remove image"
              style={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <div
          className={`flex w-full items-center gap-2 rounded-full border border-[#2b2d33] bg-[#14161b]/95 px-4 py-1.5 transition-all duration-200 focus-within:border-[#4752e2] focus-within:ring-2 focus-within:ring-[#4752e2]/40 focus-within:ring-offset-2 focus-within:ring-offset-[#090a0d] ${
            disabled ? 'opacity-80' : 'shadow-[0_6px_18px_rgba(0,0,0,0.35)]'
          }`}
        >
          {showAttachmentButton && (
            <>
              <button
                type="button"
                onClick={triggerFileInput}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-[#3a3d45] bg-[#1d1f25] text-gray-300 transition-colors duration-200 hover:border-[#525661] hover:bg-[#262931] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#4752e2] focus:ring-offset-2 focus:ring-offset-[#090a0d] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={disabled || isUploading}
                title="Attach Image"
                aria-label="Attach image"
              >
                <Plus size={16} />
              </button>
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleImageSelect}
                aria-hidden="true"
                disabled={disabled}
              />
            </>
          )}
          <div className="flex-1 flex items-center">
            <SecureTextarea
              ref={textareaRef}
              value={content}
              onChange={setContent}
              onKeyDown={handleKeyDown}
              placeholder={selectedImage ? 'Add a caption...' : placeholder}
              className="w-full !bg-transparent !border-0 !shadow-none !px-0 !py-0 text-[14px] text-gray-100 placeholder:text-gray-500 focus:!outline-none focus:!ring-0 leading-[1.55] min-h-[30px] resize-none flex items-center"
              rows={1}
              maxLength={maxLength}
              characterCount={false}
              sanitize={true}
              disabled={disabled}
              aria-label="Message text"
            />
          </div>

          {showEmojiButton && (
            <button
              type="button"
              onClick={() => {
                if (disabled) return;
                onEmojiClick?.();
                textareaRef.current?.focus();
              }}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-transparent text-gray-300 transition-colors duration-200 hover:text-white hover:bg-[#262931] focus:outline-none focus:ring-2 focus:ring-[#4752e2] focus:ring-offset-2 focus:ring-offset-[#090a0d] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={disabled}
              title="Add emoji"
              aria-label="Add emoji"
            >
              <Smile size={16} />
            </button>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSend}
              disabled={disabled || (!content.trim() && !selectedImage) || isUploading}
              className={`flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#090a0d] ${
                disabled || (!content.trim() && !selectedImage) || isUploading
                  ? 'bg-[#262931] text-gray-500 cursor-not-allowed focus:ring-[#262931]'
                  : 'bg-gradient-to-r from-[#ff9c27] to-[#f97316] text-black shadow-[0_6px_18px_rgba(249,115,22,0.35)] hover:from-[#ff8b1c] hover:to-[#f97316] focus:ring-[#f97316]'
              }`}
              aria-label="Send message"
            >
              <Send size={16} />
            </button>
          </div>
        </div>

        <div className="self-end text-xs text-gray-500 text-right pr-1 tracking-tight">{content.length}/{maxLength}</div>
      </div>
    </div>
  );
};

export default MessageInput;
