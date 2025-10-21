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
    <div className={`px-4 py-2 border-t border-[#1f1f24] bg-[#111214] ${className}`}>
      {isUploading && (
        <div className="mb-2 flex items-center text-sm text-[#ff950e]">
          <div className="w-4 h-4 mr-2 border-2 border-[#ff950e] border-t-transparent rounded-full animate-spin"></div>
          Optimizing image...
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

      <div className="flex flex-col gap-1">
        <div
          className={`flex w-full items-center gap-1.5 rounded-2xl border border-[#2a2d31] bg-[#1a1c20] px-3 py-1.5 transition-all duration-150 focus-within:border-[#3d4352] focus-within:ring-1 focus-within:ring-[#4752e2]/40 focus-within:ring-offset-1 focus-within:ring-offset-[#111214] ${
            disabled ? 'opacity-90' : ''
          }`}
        >
          {showAttachmentButton && (
            <>
              <button
                type="button"
                onClick={triggerFileInput}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-[#363840] bg-[#202226] text-gray-300 transition-colors duration-150 hover:border-[#4a4c56] hover:bg-[#272a2f] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#4752e2] focus:ring-offset-2 focus:ring-offset-[#111214] disabled:cursor-not-allowed disabled:opacity-60"
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
          <div className="flex flex-1 items-center gap-2 min-w-0">
            <div className="flex-1 min-w-0">
              <SecureTextarea
                ref={textareaRef}
                value={content}
                onChange={setContent}
                onKeyDown={handleKeyDown}
                placeholder={selectedImage ? 'Add a caption...' : placeholder}
                className="w-full !bg-transparent !border-0 !shadow-none !px-0 !py-[6px] text-[15px] text-gray-100 placeholder:text-gray-500 focus:!outline-none focus:!ring-0 leading-[1.6] min-h-[30px] resize-none"
                rows={1}
                maxLength={maxLength}
                characterCount={false}
                sanitize={true}
                disabled={disabled}
                aria-label="Message text"
              />
            </div>
            {validationError && (
              <div
                className="ml-1 flex items-center gap-1 text-xs text-red-400 whitespace-nowrap"
                role="alert"
                aria-live="polite"
              >
                <span aria-hidden="true">⚠️</span>
                <span className="truncate max-w-[140px] sm:max-w-[200px]">
                  {sanitizeStrict(validationError)}
                </span>
              </div>
            )}
          </div>

          {showEmojiButton && (
            <button
              type="button"
              onClick={() => {
                if (disabled) return;
                onEmojiClick?.();
                textareaRef.current?.focus();
              }}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-transparent text-gray-300 transition-colors duration-150 hover:text-white hover:bg-[#272a2f] focus:outline-none focus:ring-2 focus:ring-[#4752e2] focus:ring-offset-2 focus:ring-offset-[#111214] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={disabled}
              title="Add emoji"
              aria-label="Add emoji"
            >
              <Smile size={16} />
            </button>
          )}

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleSend}
              disabled={disabled || (!content.trim() && !selectedImage) || isUploading}
              className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#111214] ${
                disabled || (!content.trim() && !selectedImage) || isUploading
                  ? 'bg-[#2b2c31] text-gray-500 cursor-not-allowed focus:ring-[#2b2c31]'
                  : 'bg-[#5865f2] text-white hover:bg-[#4752e2] focus:ring-[#5865f2]'
              }`}
              aria-label="Send message"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageInput;
