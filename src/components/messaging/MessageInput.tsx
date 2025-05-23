'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Paperclip, Send, X } from 'lucide-react';
import { compressImage } from '@/utils/imageUtils';

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
 * Reusable message input component with image attachment support
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
    
    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';
    
    // Set the height to the scrollHeight
    const newHeight = Math.min(textarea.scrollHeight, 200); // Max height: 200px
    textarea.style.height = `${newHeight}px`;
  }, [content]);

  // Handle attachment click
  const triggerFileInput = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  // Handle image selection
  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    // Fixed: Added null check for event.target
    if (!event.target) return;
    
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      setIsUploading(true);
      
      // Compress the image before using it
      const compressedImage = await compressImage(file, 1200, 0.7);
      setSelectedImage(compressedImage);
      
      // Update placeholder
      if (textareaRef.current) {
        textareaRef.current.placeholder = 'Add a caption...';
      }
    } catch (error) {
      console.error('Error processing image:', error);
      alert('Error processing image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle removing the selected image
  const handleRemoveImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    // Restore placeholder
    if (textareaRef.current) {
      textareaRef.current.placeholder = placeholder;
    }
    
    // Focus back on textarea
    textareaRef.current?.focus();
  };

  // Handle sending the message
  const handleSend = () => {
    if (disabled || !content.trim() && !selectedImage || isUploading) {
      return;
    }
    
    onSendMessage(content.trim(), selectedImage);
    
    // Reset state
    setContent('');
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    // Focus back on textarea
    textareaRef.current?.focus();
  };

  // Handle Enter key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={`px-4 py-3 border-t border-gray-800 bg-[#1a1a1a] ${className}`}>
      {/* Image upload loading indicator */}
      {isUploading && (
        <div className="mb-2 flex items-center text-sm text-[#ff950e]">
          <div className="w-4 h-4 mr-2 border-2 border-[#ff950e] border-t-transparent rounded-full animate-spin"></div>
          Optimizing image...
        </div>
      )}
      
      {/* Selected image preview */}
      {selectedImage && (
        <div className="mb-2">
          <div className="relative inline-block">
            <img 
              src={selectedImage} 
              alt="Preview" 
              className="max-h-20 rounded shadow-md" 
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
        {/* Message input */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, maxLength))}
            onKeyDown={handleKeyDown}
            placeholder={selectedImage ? "Add a caption..." : placeholder}
            className="w-full p-3 pr-10 rounded-lg bg-[#222] border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e] min-h-[60px] resize-none"
            rows={1} // Start with 1 row, will auto-expand
            disabled={disabled}
            aria-label="Message text"
          />
          <div className="absolute bottom-2 right-2">
            <span className="text-xs text-gray-400">
              {content.length}/{maxLength}
            </span>
          </div>
        </div>
        
        {/* Input actions */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            {/* Attachment button */}
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
            
            {/* Hidden file input */}
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleImageSelect}
              aria-hidden="true"
              disabled={disabled}
            />
          </div>
          
          {/* Send button */}
          <button
            type="button"
            onClick={handleSend}
            disabled={disabled || !content.trim() && !selectedImage || isUploading}
            className={`px-4 py-2 rounded-full flex items-center gap-2 transition-colors ${
              disabled || !content.trim() && !selectedImage || isUploading
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