// src/components/messaging/MessageInput.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Paperclip, Send, X } from 'lucide-react';
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
    <div className={`px-4 py-3 border-t border-gray-800 bg-[#1a1a1a] ${className}`}>
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

      <div className="flex flex-col gap-2">
        <div className="relative">
          <SecureTextarea
            ref={textareaRef}
            value={content}
            onChange={setContent}
            onKeyDown={handleKeyDown}
            placeholder={selectedImage ? 'Add a caption...' : placeholder}
            className="w-full p-3 pr-10 rounded-lg bg-[#222] border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e] min-h-[60px] resize-none"
            rows={1}
            maxLength={maxLength}
            characterCount={false}
            sanitize={true}
            disabled={disabled}
            aria-label="Message text"
          />
          <div className="absolute bottom-2 right-2">
            <span className="text-xs text-gray-400">
              {content.length}/{maxLength}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            {showAttachmentButton && (
              <button
                type="button"
                onClick={triggerFileInput}
                className="p-2 rounded-full bg-[#ff950e] text-black hover:bg-[#e88800] disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={disabled || isUploading}
                title="Attach Image"
                aria-label="Attach image"
              >
                <Paperclip size={20} />
              </button>
            )}
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleImageSelect}
              aria-hidden="true"
              disabled={disabled}
            />
          </div>

          <button
            type="button"
            onClick={handleSend}
            disabled={disabled || (!content.trim() && !selectedImage) || isUploading}
            className={`px-4 py-2 rounded-full flex items-center gap-2 transition-colors ${
              disabled || (!content.trim() && !selectedImage) || isUploading
                ? 'bg-[#333] text-gray-500 cursor-not-allowed'
                : 'bg-[#ff950e] text-black hover:bg-[#e88800]'
            }`}
            aria-label="Send message"
          >
            <Send size={18} />
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessageInput;
