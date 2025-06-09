// src/components/sellers/messages/MessageInput.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Smile, X, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import EmojiPicker from './EmojiPicker';
import { compressImage } from '@/utils/imageUtils';

interface MessageInputProps {
  onSendMessage: (text: string, image?: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  placeholder = 'Type a message',
  disabled = false,
  autoFocus = false
}) => {
  const [content, setContent] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  
  // Auto-focus
  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);
  
  // Auto-resize textarea
  useEffect(() => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    textarea.style.height = 'auto';
    const newHeight = Math.min(textarea.scrollHeight, 120);
    textarea.style.height = `${newHeight}px`;
  }, [content]);
  
  const handleSend = () => {
    if (disabled) return;
    
    if (content.trim() || selectedImage) {
      onSendMessage(content.trim(), selectedImage);
      setContent('');
      setSelectedImage(null);
      setImageError(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setImageError(null);
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setImageError('Please select a valid image file');
      return;
    }
    
    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setImageError('Image size must be less than 5MB');
      return;
    }
    
    try {
      setIsImageLoading(true);
      const compressed = await compressImage(file, 1200, 0.8);
      setSelectedImage(compressed);
    } catch (error) {
      console.error('Error processing image:', error);
      setImageError('Failed to process image. Please try again.');
    } finally {
      setIsImageLoading(false);
    }
  };
  
  const handleEmojiSelect = (emoji: string) => {
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      const newContent = content.substring(0, start) + emoji + content.substring(end);
      setContent(newContent);
      
      // Set cursor position after emoji
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = start + emoji.length;
          textareaRef.current.selectionEnd = start + emoji.length;
          textareaRef.current.focus();
        }
      }, 0);
    }
  };
  
  return (
    <div className="relative">
      {/* Emoji Picker */}
      <AnimatePresence>
        {showEmojiPicker && (
          <div className="absolute bottom-full mb-2 right-0 z-50">
            <EmojiPicker
              onEmojiSelect={handleEmojiSelect}
              onClose={() => setShowEmojiPicker(false)}
              anchorRef={emojiButtonRef}
            />
          </div>
        )}
      </AnimatePresence>
      
      {/* Selected Image Preview */}
      {selectedImage && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="mb-3 relative inline-block"
        >
          <img
            src={selectedImage}
            alt="Preview"
            className="max-h-32 rounded-lg shadow-lg"
          />
          <button
            onClick={() => {
              setSelectedImage(null);
              if (fileInputRef.current) {
                fileInputRef.current.value = '';
              }
            }}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
      
      {/* Error Message */}
      {imageError && (
        <div className="mb-2 text-sm text-red-400">
          {imageError}
        </div>
      )}
      
      {/* Input Container */}
      <div className="flex items-end gap-2">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={selectedImage ? 'Add a caption...' : placeholder}
            disabled={disabled}
            className="w-full px-4 py-3 pr-24 bg-[#2a2a2a] border border-gray-700 rounded-2xl text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            rows={1}
            maxLength={500}
          />
          
          {/* Action Buttons Inside Input */}
          <div className="absolute right-2 bottom-2 flex items-center gap-1">
            {/* Character Count */}
            {content.length > 0 && (
              <span className="text-xs text-gray-500 mr-2">
                {content.length}/500
              </span>
            )}
            
            {/* Emoji Button */}
            <button
              ref={emojiButtonRef}
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              disabled={disabled}
              className="p-2 text-gray-400 hover:text-white hover:bg-[#3a3a3a] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              type="button"
            >
              <Smile className="w-5 h-5" />
            </button>
            
            {/* Attachment Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || isImageLoading}
              className="p-2 text-gray-400 hover:text-white hover:bg-[#3a3a3a] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              type="button"
            >
              {isImageLoading ? (
                <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Paperclip className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
        
        {/* Send Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSend}
          disabled={disabled || (!content.trim() && !selectedImage)}
          className={`
            p-3 rounded-full transition-all
            ${content.trim() || selectedImage
              ? 'bg-purple-600 text-white hover:bg-purple-700'
              : 'bg-[#2a2a2a] text-gray-500 cursor-not-allowed'
            }
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        >
          <Send className="w-5 h-5" />
        </motion.button>
      </div>
      
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageSelect}
        className="hidden"
      />
    </div>
  );
};

export default MessageInput;